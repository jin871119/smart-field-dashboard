import { StoreData } from "../types";
import { generateLocalInsight } from "../utils/localAIInsight";
import { analyzeItemSeasonData } from "../utils/itemSeasonAnalyzer";
import { dataService } from "./dataService";
import { callGeminiWithFallback, getGeminiApiKey } from "./geminiModelManager";
import { buildStoreInsightPrompt } from "../prompts/storeInsightPrompt";

export const getStoreInsights = async (storeData: StoreData): Promise<string> => {
  const apiKey = getGeminiApiKey();

  // 아이템시즌별판매 데이터 로드
  let itemSeasonData;
  try {
    itemSeasonData = await dataService.getItemSeasonData();
  } catch (err) {
    console.error("Failed to load item season data", err);
  }

  if (!apiKey) {
    console.warn('API key not found, using local AI analysis');
    return generateLocalInsight(storeData, itemSeasonData);
  }

  // 아이템시즌별판매 데이터 분석
  const itemSeasonAnalysis = analyzeItemSeasonData(storeData.store.name, itemSeasonData);

  // 프롬프트 생성
  const prompt = buildStoreInsightPrompt(storeData, itemSeasonAnalysis);

  try {
    const result = await callGeminiWithFallback(prompt, apiKey);

    if (result) return result;

    // 모든 모델 실패 - 로컬 AI 분석으로 대체
    console.warn('All Gemini models failed, using local AI analysis');
    return generateLocalInsight(storeData, itemSeasonData);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return generateLocalInsight(storeData, itemSeasonData);
  }
};
