
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
    // 사용 가능한 모델 시도 순서: gemini-1.5-flash-latest, gemini-1.5-pro, gemini-pro
    let model;
    let result;
    let response;
    let text;
    
    // 먼저 gemini-1.5-flash-latest 시도
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      result = await model.generateContent(prompt);
      response = await result.response;
      text = response.text();
    } catch (flashError: any) {
      console.warn("gemini-1.5-flash-latest failed, trying gemini-1.5-pro:", flashError);
      // gemini-1.5-pro로 재시도
      try {
        model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        result = await model.generateContent(prompt);
        response = await result.response;
        text = response.text();
      } catch (proError: any) {
        console.warn("gemini-1.5-pro failed, trying gemini-pro:", proError);
        // 마지막으로 gemini-pro 시도
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
        result = await model.generateContent(prompt);
        response = await result.response;
        text = response.text();
      }
    }
    
    if (!text) {
      console.warn("Gemini API returned empty response");
      return "인사이트를 불러올 수 없습니다. 응답이 비어있습니다.";
    }
    
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // 더 자세한 에러 메시지
    if (error?.message?.includes('API_KEY')) {
      return "⚠️ API 키가 유효하지 않습니다. .env.local 파일의 VITE_GEMINI_API_KEY를 확인해주세요.";
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      return "⚠️ API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.";
    }
    
    return `⚠️ AI 분석 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`;
  }
};
