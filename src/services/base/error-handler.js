import { YouTubeAnalyzerError } from '../../utils/errors.js';

export class ServiceErrorHandler {
  static async handleAsync(fn, context = '', fallbackFn = null) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Service error in ${context}:`, error);
      
      if (fallbackFn) {
        try {
          console.log(`Attempting fallback for ${context}`);
          return await fallbackFn(error);
        } catch (fallbackError) {
          console.error(`Fallback also failed for ${context}:`, fallbackError);
        }
      }
      
      if (error instanceof YouTubeAnalyzerError) {
        throw error;
      }
      
      throw new YouTubeAnalyzerError(
        error.message || `エラーが発生しました: ${context}`,
        error.code || 'SERVICE_ERROR',
        error.statusCode || 500
      );
    }
  }

  static wrapService(service) {
    const wrapped = {};
    
    for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(service))) {
      if (method === 'constructor') continue;
      
      const originalMethod = service[method];
      if (typeof originalMethod === 'function') {
        wrapped[method] = async (...args) => {
          return this.handleAsync(
            () => originalMethod.apply(service, args),
            `${service.constructor.name}.${method}`
          );
        };
      }
    }
    
    return wrapped;
  }

  static createErrorResponse(error) {
    const errorMap = {
      'NO_VIDEOS_FOUND': { message: '動画が見つかりませんでした', status: 404 },
      'CHANNEL_NOT_FOUND': { message: 'チャンネルが見つかりませんでした', status: 404 },
      'INVALID_URL': { message: '無効なURLです', status: 400 },
      'API_QUOTA_EXCEEDED': { message: 'API使用制限に達しました', status: 429 },
      'TIMEOUT': { message: 'リクエストがタイムアウトしました', status: 408 },
      'NETWORK_ERROR': { message: 'ネットワークエラーが発生しました', status: 503 },
      'VIDEO_ANALYSIS_ERROR': { message: 'ビデオ分析中にエラーが発生しました', status: 500 },
      'COMMENT_ANALYSIS_ERROR': { message: 'コメント分析中にエラーが発生しました', status: 500 },
      'IDEA_GENERATION_ERROR': { message: 'アイデア生成中にエラーが発生しました', status: 500 },
    };

    const errorInfo = errorMap[error.code] || { 
      message: error.message || 'エラーが発生しました', 
      status: error.statusCode || 500 
    };

    return {
      statusCode: errorInfo.status,
      error: errorInfo.message,
      details: process.env.NODE_ENV === 'development' ? {
        originalMessage: error.message,
        code: error.code,
        stack: error.stack
      } : undefined
    };
  }
}