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
    month: 'long',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString(locale, { ...defaultOptions, ...options });
}

export function formatDuration(duration) {
  if (!duration) return null;
  
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return null;
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function truncateText(text, maxLength = 300) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function getThumbnailUrl(thumbnails, preference = ['high', 'medium', 'default']) {
  for (const quality of preference) {
    if (thumbnails?.[quality]?.url) {
      return thumbnails[quality].url;
    }
  }
  return 'https://via.placeholder.com/320x180?text=No+Image';
}

export function formatApiResponse(success, data = null, error = null) {
  if (success) {
    return { success: true, data };
  }
  return {
    success: false,
    error: error.message || error,
    ...(error.details && { details: error.details }),
  };
}