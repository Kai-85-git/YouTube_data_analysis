import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/config.js';

export class BaseGeminiService {
  constructor() {
    this.models = this.initializeModels();
  }

  initializeModels() {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    
    return [
      genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }),
      genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }),
      genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    ];
  }

  async generateWithFallback(prompt, modelIndex = 0) {
    if (modelIndex >= this.models.length) {
      throw new Error('すべてのモデルでの生成に失敗しました');
    }

    try {
      const model = this.models[modelIndex];
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.warn(`Model ${modelIndex} failed, trying next model...`, error.message);
      return this.generateWithFallback(prompt, modelIndex + 1);
    }
  }

  extractJSON(text) {
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      const cleanedText = text.trim();
      if (cleanedText.startsWith('{') || cleanedText.startsWith('[')) {
        return JSON.parse(cleanedText);
      }
      
      throw new Error('JSONの抽出に失敗しました');
    } catch (error) {
      console.error('JSON extraction error:', error);
      throw new Error('レスポンスの解析に失敗しました');
    }
  }

  formatPromptWithJSON(promptText, jsonStructure) {
    return `${promptText}

必ず以下のJSON形式で回答してください:
\`\`\`json
${JSON.stringify(jsonStructure, null, 2)}
\`\`\``;
  }
}