import { createApiHandler, validateRequired } from '../src/utils/api-handler.js';

export default createApiHandler(async (req, res) => {
  const { YouTubeService } = await import('../src/services/youtube-service.js');
  const { validateYouTubeUrl } = await import('../src/utils/validators.js');
  
  const { url } = req.body;
  validateRequired(req.body, ['url']);
  
  const validation = validateYouTubeUrl(url);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  const youtubeService = new YouTubeService();
  return await youtubeService.analyzeChannel(url);
});