import { createApiHandler, validateRequired } from '../src/utils/api-handler.js';

export default createApiHandler(async (req, res) => {
  const { CommentAnalyzer } = await import('../src/services/comment-analyzer.js');
  const { GeminiCommentAnalyzer } = await import('../src/services/gemini-comment-analyzer.js');
  const { YouTubeApiService } = await import('../src/services/youtube-api.js');
  
  const { type, id, maxComments = 100 } = req.body;
  
  validateRequired(req.body, ['type', 'id']);
  
  if (type === 'channel') {
    const commentAnalyzer = new CommentAnalyzer();
    return await commentAnalyzer.analyzeChannelComments(id);
  } else if (type === 'video') {
    const apiService = new YouTubeApiService();
    const geminiAnalyzer = new GeminiCommentAnalyzer();
    
    const comments = await apiService.getVideoComments(id, maxComments);
    const videoInfo = await apiService.getVideoStatistics([id]);
    const videoTitle = videoInfo[0]?.snippet?.title || '動画';
    
    const result = await geminiAnalyzer.analyzeVideoComments(comments, videoTitle);
    return {
      ...result,
      videoTitle,
      videoId: id
    };
  }
  
  throw new Error('無効な分析タイプです。"channel" または "video" を指定してください');
});