export function validateYouTubeUrl(url) {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URLが必要です' };
  }
  
  if (!url.includes('youtube.com')) {
    return { isValid: false, error: '有効なYouTubeチャンネルのURLを入力してください' };
  }
  
  return { isValid: true };
}

export function extractChannelInfo(url) {
  const patterns = [
    { regex: /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, type: 'id' },
    { regex: /youtube\.com\/c\/([a-zA-Z0-9_-]+)/, type: 'handle' },
    { regex: /youtube\.com\/user\/([a-zA-Z0-9_-]+)/, type: 'handle' },
    { regex: /youtube\.com\/@([a-zA-Z0-9_-]+)/, type: 'handle' }
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return { type: pattern.type, value: match[1] };
    }
  }
  
  throw new Error('Invalid YouTube channel URL');
}