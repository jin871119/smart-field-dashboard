
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StoreData } from "../types";
import { generateLocalInsight } from "../utils/localAIInsight";

export const getStoreInsights = async (storeData: StoreData): Promise<string> => {
  // Vite에서는 클라이언트 사이드에서 import.meta.env를 사용해야 함
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
  
  // 디버깅: 환경 변수 확인
  console.log('API Key check:', {
    hasViteKey: !!import.meta.env.VITE_GEMINI_API_KEY,
    hasKey: !!import.meta.env.GEMINI_API_KEY,
    keyLength: apiKey.length,
    envKeys: Object.keys(import.meta.env).filter(k => k.includes('GEMINI'))
  });
  
  if (!apiKey) {
    console.warn('API key not found, using local AI analysis');
    return generateLocalInsight(storeData);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
    다음은 '${storeData.store.name}' 매장의 실적 데이터입니다.
    
    매장 정보: ${storeData.store.category}, 위치: ${storeData.store.location}
    매니저: ${storeData.store.manager.name} (${storeData.store.manager.position})
    
    월별 실적 (매출/목표):
    ${storeData.monthlyPerformance.map(p => `${p.month}: ${p.revenue}/${p.target}`).join(', ')}
    
    아이템별 실적 (판매량/성장률):
    ${storeData.itemPerformance.map(i => `${i.name}: ${i.sales}건 (${i.growth}%)`).join(', ')}
    
    위 데이터를 바탕으로 외근 중인 담당자가 확인해야 할 핵심 인사이트 3가지를 
    한국어로 간결하고 전문적으로 요약해 주세요. 
    이모지를 적절히 사용하고, 성과가 좋은 부분과 개선이 필요한 부분을 짚어주세요.
    최대 200자 내외로 작성해 주세요.
  `;

  try {
    // 먼저 사용 가능한 모델 목록 조회
    try {
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      );
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const availableModels = modelsData.models?.map((m: any) => m.name) || [];
        console.log('Available models from API:', availableModels);
      }
    } catch (e) {
      console.warn('Could not fetch model list:', e);
    }
    
    // @google/generative-ai 패키지 사용 - 여러 모델을 순차적으로 시도
    // 패키지는 내부적으로 올바른 API 버전과 모델 이름을 사용합니다
    // v1beta API에서 지원하는 모델만 사용 (gemini-pro는 v1beta에서 지원 안 함)
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    let lastError: any = null;
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        // API 버전을 명시하지 않고 패키지가 자동으로 처리하도록 함
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          // generationConfig를 추가하여 호환성 향상
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          console.warn(`Model ${modelName} returned empty response`);
          continue; // 다음 모델 시도
        }
        
        console.log(`Success with model: ${modelName}`);
        return text;
      } catch (error: any) {
        console.warn(`Model ${modelName} error:`, error);
        lastError = error;
        
        // 404나 not found 오류면 다음 모델 시도
        if (error?.message?.includes('404') || 
            error?.message?.includes('not found') ||
            error?.message?.includes('not supported')) {
          continue; // 다음 모델 시도
        }
        
        // 네트워크 오류나 다른 심각한 오류면 다음 모델 시도
        continue;
      }
    }
    
    // 모든 모델 실패 - 로컬 AI 분석으로 대체
    console.warn('All Gemini models failed, using local AI analysis');
    return generateLocalInsight(storeData);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // API 키 오류는 명확히 표시
    if (error?.message?.includes('API_KEY') || error?.message?.includes('401')) {
      // API 키 오류 시에도 로컬 분석 제공
      console.warn('API key error, using local AI analysis');
      return generateLocalInsight(storeData);
    }
    
    // 할당량 초과도 로컬 분석으로 대체
    if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      console.warn('API quota exceeded, using local AI analysis');
      return generateLocalInsight(storeData);
    }
    
    // 기타 오류도 로컬 분석으로 대체
    console.warn('API error occurred, using local AI analysis as fallback');
    return generateLocalInsight(storeData);
  }
};
