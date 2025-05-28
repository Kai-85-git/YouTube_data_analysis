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