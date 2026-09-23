import { GoogleGenerativeAI } from "@google/generative-ai";

/** Gemini API 키 가져오기 (Vite 환경변수) */
export const getGeminiApiKey = (): string => {
  return (import.meta as any).env.VITE_GEMINI_API_KEY
    || (import.meta as any).env.GEMINI_API_KEY
    || '';
};

/** 사용 가능한 Gemini 모델 목록 (우선순위 순) */
const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro'] as const;

/** 기본 생성 설정 */
const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.8,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
};

/**
 * 여러 Gemini 모델을 순차적으로 시도하여 응답을 반환
 * 모든 모델이 실패하면 null 반환
 */
export const callGeminiWithFallback = async (
  prompt: string,
  apiKey?: string
): Promise<string | null> => {
  const key = apiKey || getGeminiApiKey();
  if (!key) return null;

  const genAI = new GoogleGenerativeAI(key);

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: DEFAULT_GENERATION_CONFIG,
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (text) {
        console.log(`[Gemini] Success with model: ${modelName}`);
        return text;
      }
      console.warn(`[Gemini] Model ${modelName} returned empty response`);
    } catch (error: any) {
      console.warn(`[Gemini] Model ${modelName} error:`, error?.message);
    }
  }

  console.warn('[Gemini] All models failed');
  return null;
};
