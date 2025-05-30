export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { CommentAnalyzer } = await import('../src/services/comment-analyzer.js');
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

    const commentAnalyzer = new CommentAnalyzer();
    const result = await commentAnalyzer.analyzeChannelComments(channelId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Comment analysis error:', error);
    const errorResponse = createErrorResponse(error);
    res.status(errorResponse.statusCode).json({
      success: false,
      error: errorResponse.error,
      details: errorResponse.details,
    });
  }
}