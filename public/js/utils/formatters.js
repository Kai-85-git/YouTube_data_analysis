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

export function formatDate(dateString, locale = 'ja-JP', options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString(locale, { ...defaultOptions, ...options });
}

export function getThumbnailUrl(thumbnails, preference = ['high', 'medium', 'default']) {
  for (const quality of preference) {
    if (thumbnails?.[quality]?.url) {
      return thumbnails[quality].url;
    }
  }
  return 'https://via.placeholder.com/320x180?text=No+Image';
}

export function truncateText(text, maxLength = 300) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}