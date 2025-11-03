export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { VideoAnalysisService } = await import('../src/services/video-analysis-service.js');
  const { createErrorResponse } = await import('../src/utils/errors.js');

  try {
    const { channelId, youtubeApiKey, geminiApiKey, analysisData } = req.body;

    if (!channelId) {
      return res.status(400).json({
        success: false,
        error: 'チャンネルIDが必要です',
        message: 'チャンネルIDを指定してください',
      });
    }

    const videoAnalysisService = new VideoAnalysisService(youtubeApiKey, geminiApiKey);

    // 既存の分析データがある場合はそれを使用、ない場合は新規分析
    let result;
    if (analysisData && analysisData.videoData && analysisData.performanceMetrics) {
      // 既存の分析データから動画アイデアのみを生成
      result = await videoAnalysisService.generateVideoIdeasFromAnalysis(analysisData.videoData);
      result.basedOnAnalysis = analysisData.performanceMetrics;
    } else {
      // 新規で完全分析を実行
      result = await videoAnalysisService.generateVideoIdeas(channelId);
    }

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