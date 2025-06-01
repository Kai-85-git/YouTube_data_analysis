export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { VideoAnalysisService } = await import('../src/services/video-analysis-service.js');
  const { createErrorResponse } = await import('../src/utils/errors.js');

  try {
    const { prompt, channelId, analysisData } = req.body;

    if (!prompt || !channelId) {
      return res.status(400).json({
        success: false,
        error: '必要なパラメータが不足しています',
        message: 'promptとchannelIdが必要です',
      });
    }

    const videoAnalysisService = new VideoAnalysisService();
    const result = await videoAnalysisService.generateCustomVideoIdea(prompt, channelId, analysisData);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI custom video idea generation error:', error);
    const errorResponse = createErrorResponse(error);
    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.error,
      details: errorResponse.details,
    });
  }
}