import { createApiHandler, validateRequired, validateChannelId } from '../src/utils/api-handler.js';

export default createApiHandler(async (req, res) => {
  const { ContentIdeaService } = await import('../src/services/content-idea-service.js');
  
  const { action = 'generate-ideas', channelId, ...params } = req.body;
  
  const contentIdeaService = new ContentIdeaService();
  
  switch (action) {
    case 'generate-ideas':
      validateChannelId(channelId);
      return await contentIdeaService.generateIdeas(
        channelId, 
        params.comments, 
        params.topVideos
      );
      
    case 'generate-video-ideas':
      validateChannelId(channelId);
      return await contentIdeaService.generateVideoIdeas(channelId);
      
    case 'generate-custom-idea':
      validateRequired(params, ['prompt']);
      return await contentIdeaService.generateCustomVideoIdea(
        params.prompt,
        channelId,
        params.analysisData
      );
      
    case 'generate-ai-channel-idea':
      validateChannelId(channelId);
      return await contentIdeaService.generateAIChannelVideoIdea(
        channelId,
        params.analysisData
      );
      
    default:
      throw new Error(`無効なアクションです: ${action}`);
  }
});