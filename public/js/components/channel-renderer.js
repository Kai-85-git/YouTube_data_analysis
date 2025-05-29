import { formatDate, getThumbnailUrl, truncateText } from '../utils/formatters.js';

export class ChannelRenderer {
  populateChannelInfo(channel) {
    const thumbnail = getThumbnailUrl(channel.thumbnails);
    
    document.getElementById('channelThumbnail').src = thumbnail;
    document.getElementById('channelTitle').textContent = channel.title;
    document.getElementById('channelId').textContent = `チャンネルID: ${channel.id}`;
    
    const createdDate = formatDate(channel.publishedAt, 'ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('channelCreated').textContent = `作成日: ${createdDate}`;
    
    if (channel.customUrl) {
      document.getElementById('channelUrl').textContent = `URL: ${channel.customUrl}`;
    } else {
      document.getElementById('channelUrl').textContent = '';
    }
    
    const description = channel.description || 'チャンネルの説明がありません';
    document.getElementById('channelDescription').textContent = truncateText(description);
  }
}