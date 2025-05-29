// 共通ユーティリティ: フォーマット関数とエラーハンドリング

// 数値フォーマット
export function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

// 日付フォーマット
export function formatDate(dateString, locale = 'ja-JP', options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString(locale, { ...defaultOptions, ...options });
}

// サムネイル URL 取得
export function getThumbnailUrl(thumbnails, preference = ['high', 'medium', 'default']) {
  for (const quality of preference) {
    if (thumbnails?.[quality]?.url) {
      return thumbnails[quality].url;
    }
  }
  return 'https://via.placeholder.com/320x180?text=No+Image';
}

// テキスト切り詰め
export function truncateText(text, maxLength = 300) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// クライアントサイドエラーメッセージ作成
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