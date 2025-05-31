export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Check if API keys are configured
    if (!process.env.YOUTUBE_API_KEY || !process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'API keys are not configured',
        message: 'サーバーの設定に問題があります。管理者にお問い合わせください。'
      });
    }

    const { YouTubeService } = await import('../src/services/youtube-service.js');
    const { validateYouTubeUrl } = await import('../src/utils/validators.js');
    const { createErrorResponse } = await import('../src/utils/errors.js');
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URLが必要です',
        message: 'YouTubeチャンネルのURLを指定してください',
      });
    }

    const validation = validateYouTubeUrl(url);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        message: validation.error,
      });
    }

    const youtubeService = new YouTubeService();
    const channelData = await youtubeService.analyzeChannel(url);

    res.status(200).json({
      success: true,
      data: channelData,
    });
  } catch (error) {
    console.error('API error:', error);
    const errorResponse = createErrorResponse(error);
    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.error,
      details: errorResponse.details,
    });
  }
}