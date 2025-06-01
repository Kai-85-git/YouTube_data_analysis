import { createErrorResponse } from './errors.js';

export function createApiHandler(handler, options = {}) {
  const { method = 'POST' } = options;
  
  return async (req, res) => {
    if (req.method !== method) {
      return res.status(405).json({ 
        success: false,
        error: `Method ${req.method} Not Allowed. Expected ${method}.` 
      });
    }
    
    try {
      const result = await handler(req, res);
      
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          data: result,
        });
      }
    } catch (error) {
      console.error('API Error:', error);
      const errorResponse = createErrorResponse(error);
      
      if (!res.headersSent) {
        res.status(errorResponse.statusCode).json({
          success: false,
          error: errorResponse.error,
          details: errorResponse.details,
        });
      }
    }
  };
}

export function validateRequired(params, required) {
  const missing = required.filter(field => !params[field]);
  
  if (missing.length > 0) {
    throw new Error(`必要なパラメータが不足しています: ${missing.join(', ')}`);
  }
}

export function validateChannelId(channelId) {
  if (!channelId) {
    throw new Error('チャンネルIDが必要です');
  }
}

export function validateVideoId(videoId) {
  if (!videoId) {
    throw new Error('動画IDが必要です');
  }
}