export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { VideoAnalysisService } = await import('../src/services/video-analysis-service.js');
  const { createErrorResponse } = await import('../src/utils/errors.js');

  try {
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({
        success: false,
        error: 'チャンネルIDが必要です',
        message: 'チャンネルIDを指定してください',
      });
    }

    const videoAnalysisService = new VideoAnalysisService();
    const result = await videoAnalysisService.generateVideoIdeas(channelId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI video ideas generation error:', error);
    const errorResponse = createErrorResponse(error);
    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.error,
      details: errorResponse.details,
    });
  }
}