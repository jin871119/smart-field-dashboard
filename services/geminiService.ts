
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

  // 상세한 프롬프트 작성
  const monthlyDetails = storeData.monthlyPerformance
    .map(p => `${p.month}: ${p.revenue}만원 (전년 ${p.target}만원, ${p.growthRate && p.growthRate >= 0 ? '+' : ''}${p.growthRate?.toFixed(1) || 0}%)`)
    .join('\n');
  
  const topItems = storeData.itemPerformance
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5)
    .map(i => `- ${i.name}: ${i.sales}건 판매, ${i.growth >= 0 ? '+' : ''}${i.growth.toFixed(1)}% 성장`)
    .join('\n');
  
  const prompt = `당신은 소매업체의 현장 관리 전문가입니다. 다음 매장 데이터를 분석하여 실무진이 즉시 활용할 수 있는 구체적이고 실행 가능한 인사이트를 제공해주세요.

【매장 정보】
- 매장명: ${storeData.store.name}
- 매장 형태: ${storeData.store.category}
- 위치: ${storeData.store.location}
- 담당 매니저: ${storeData.store.manager.name} (${storeData.store.manager.position})
- 연매출 (1~11월): ${storeData.yearToDateRevenue?.toLocaleString() || 0}만원
- 전년 대비 신장률: ${storeData.growthRate && storeData.growthRate >= 0 ? '+' : ''}${storeData.growthRate?.toFixed(1) || 0}%

【월별 실적 상세】
${monthlyDetails}

【주요 아이템 성과 (상위 5개)】
${topItems}

【분석 요청사항】
1. 매장의 전반적인 성과를 한 문장으로 요약
2. 가장 주목해야 할 핵심 이슈 1가지 (긍정적이거나 개선 필요)
3. 즉시 실행 가능한 액션 아이템 1가지

다음 형식으로 작성해주세요:
- 간결하고 전문적인 톤
- 구체적인 수치와 데이터 언급
- 실행 가능한 제안 포함
- 이모지 적절히 사용 (최대 3개)
- 총 250자 내외
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
