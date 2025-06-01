export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { GeminiCommentAnalyzer } = await import('../src/services/gemini-comment-analyzer.js');
  const { YouTubeApiService } = await import('../src/services/youtube-api.js');
  const { createErrorResponse } = await import('../src/utils/errors.js');

  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: '動画IDが必要です',
        message: '動画IDを指定してください',
      });
    }

    const apiService = new YouTubeApiService();
    const geminiCommentAnalyzer = new GeminiCommentAnalyzer();

    // Get comments for the specific video
    const comments = await apiService.getVideoComments(videoId, 100);
    
    // Get video info
    const videoInfo = await apiService.getVideoStatistics([videoId]);
    const videoTitle = videoInfo[0]?.snippet?.title || '動画';

    // Use Gemini to analyze comments
    const result = await geminiCommentAnalyzer.analyzeVideoComments(comments, videoTitle);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        videoTitle: videoTitle,
        videoId: videoId
      }
    });
  } catch (error) {
    console.error('Video comment analysis error:', error);
    const errorResponse = createErrorResponse(error);
    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.error,
      details: errorResponse.details,
    });
  }
}