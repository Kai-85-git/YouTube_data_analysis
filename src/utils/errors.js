export class YouTubeAnalyzerError extends Error {
  constructor(message, code = null, statusCode = 500) {
    super(message);
    this.name = 'YouTubeAnalyzerError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function createErrorResponse(error) {
  let errorMessage = 'チャンネルの分析中にエラーが発生しました';
  let statusCode = 500;
  
  // 詳細なエラーログ
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    response: error.response,
    errors: error.errors,
    stack: error.stack
  });
  
  if (error.message.includes('Channel not found')) {
    errorMessage = 'チャンネルが見つかりませんでした。URLを確認してください。';
    statusCode = 404;
  } else if (error.message.includes('Invalid YouTube channel URL')) {
    errorMessage = '無効なYouTubeチャンネルのURLです。正しい形式で入力してください。';
    statusCode = 400;
  } else if (error.message.includes('quota')) {
    errorMessage = 'API使用制限に達しました。しばらく時間をおいて再試行してください。';
    statusCode = 429;
  } else if (error.message.includes('timeout')) {
    errorMessage = 'リクエストがタイムアウトしました。ネットワーク接続を確認して再試行してください。';
    statusCode = 408;
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    errorMessage = 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
    statusCode = 503;
  } else if (error.response?.status === 403) {
    errorMessage = 'APIキーが無効か、使用制限に達しています';
    statusCode = 403;
  } else if (error.errors && error.errors[0]) {
    errorMessage = `YouTube API Error: ${error.errors[0].message}`;
    statusCode = error.code || 400;
  }
  
  return {
    statusCode,
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
}

export function createClientErrorMessage(error) {
  if (error.name === 'AbortError') {
    return 'リクエストがタイムアウトしました。ネットワーク接続を確認して再試行してください。';
  } else if (error.message.includes('Failed to fetch')) {
    return 'サーバーに接続できませんでした。サーバーが起動しているか確認してください。';
  } else if (error.message.includes('NetworkError')) {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
  }
  return error.message || 'エラーが発生しました。';
}