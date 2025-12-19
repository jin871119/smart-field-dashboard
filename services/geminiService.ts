
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StoreData } from "../types";

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
    return "⚠️ Gemini API 키가 설정되지 않았습니다. .env.local 파일에 VITE_GEMINI_API_KEY를 설정하고 개발 서버를 재시작해주세요.";
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
    // @google/generative-ai 패키지 사용 - 여러 모델을 순차적으로 시도
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    
    let lastError: any = null;
    
    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
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
        
        // 404가 아니면 다른 오류이므로 중단하지 않고 다음 모델 시도
        if (error?.message?.includes('404') || error?.message?.includes('not found')) {
          continue; // 다음 모델 시도
        }
        
        // 네트워크 오류나 다른 심각한 오류면 다음 모델 시도
        continue;
      }
    }
    
    // 모든 모델 실패
    throw lastError || new Error('All models failed');
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // 더 자세한 에러 메시지
    if (error?.message?.includes('API_KEY') || error?.message?.includes('401')) {
      return "⚠️ API 키가 유효하지 않습니다. .env.local 파일의 VITE_GEMINI_API_KEY를 확인해주세요.";
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      return "⚠️ API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.";
    }
    
    return `⚠️ AI 분석 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`;
  }
};
