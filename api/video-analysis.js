import { createApiHandler, validateRequired, validateChannelId } from '../src/utils/api-handler.js';

export default createApiHandler(async (req, res) => {
  const { VideoAnalysisService } = await import('../src/services/video-analysis-service.js');
  
  const { action, channelId, ...params } = req.body;
  
  validateRequired(req.body, ['action']);
  const videoAnalysisService = new VideoAnalysisService();
  
  switch (action) {
    case 'analyze-performance':
      validateChannelId(channelId);
      return await videoAnalysisService.analyzeChannelVideos(channelId, params.maxVideos || 50);
      
    case 'generate-ideas':
      validateChannelId(channelId);
      const analysisData = await videoAnalysisService.analyzeChannelVideos(channelId, 50);
      return await videoAnalysisService.generateVideoIdeasFromAnalysis(analysisData);
      
    case 'generate-custom-idea':
      validateRequired(params, ['prompt']);
      return await videoAnalysisService.generateCustomVideoIdea(
        params.prompt, 
        channelId, 
        params.analysisData
      );
      
    default:
      throw new Error(`無効なアクションです: ${action}. 使用可能: analyze-performance, generate-ideas, generate-custom-idea`);
  }
});