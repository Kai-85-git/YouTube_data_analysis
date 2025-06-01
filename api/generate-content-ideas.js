export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ContentIdeaService } = await import('../src/services/content-idea-service.js');
  const { createErrorResponse } = await import('../src/utils/errors.js');

  try {
    const { channelId, comments, topVideos } = req.body;

    if (!channelId) {
      return res.status(400).json({
        success: false,
        error: 'チャンネルIDが必要です',
        message: 'チャンネルIDを指定してください',
      });
    }

    const contentIdeaService = new ContentIdeaService();
    const ideas = await contentIdeaService.generateIdeas(channelId, comments, topVideos);

    res.status(200).json({
      success: true,
      data: ideas,
    });
  } catch (error) {
    console.error('Content idea generation error:', error);
    const errorResponse = createErrorResponse(error);
    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.error,
      details: errorResponse.details,
    });
  }
}