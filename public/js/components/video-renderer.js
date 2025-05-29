import { formatNumber, formatDate, getThumbnailUrl } from '../utils/formatters.js';

export class VideoRenderer {
  populateVideos(videos) {
    const videosGrid = document.getElementById('videosGrid');
    videosGrid.innerHTML = '';

    videos.slice(0, 6).forEach(video => {
      const videoCard = this.createVideoCard(video);
      videosGrid.appendChild(videoCard);
    });
  }

  createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const thumbnail = getThumbnailUrl(video.thumbnails);
    const publishedDate = formatDate(video.publishedAt);

    card.innerHTML = `
      <div class="video-thumbnail">
        <img src="${thumbnail}" alt="${video.title}" loading="lazy">
      </div>
      <div class="video-info">
        <h4 class="video-title">${video.title}</h4>
        <p class="video-date">${publishedDate}</p>
      </div>
    `;

    card.addEventListener('click', () => {
      window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    });

    card.style.cursor = 'pointer';
    return card;
  }

  populateTopVideos(topVideos) {
    const topVideosList = document.getElementById('topVideosList');
    topVideosList.innerHTML = '';

    if (!topVideos || topVideos.length === 0) {
      topVideosList.innerHTML = '<p style="text-align: center; color: #666;">TOP動画データが取得できませんでした</p>';
      return;
    }

    topVideos.forEach((video, index) => {
      const topVideoItem = this.createTopVideoItem(video, index + 1);
      topVideosList.appendChild(topVideoItem);
    });
  }

  createTopVideoItem(video, rank) {
    const item = document.createElement('div');
    item.className = 'top-video-item';
    
    const thumbnail = getThumbnailUrl(video.thumbnails);
    const publishedDate = formatDate(video.publishedAt);

    const viewCount = video.statistics?.viewCount || 0;
    const likeCount = video.statistics?.likeCount || 0;
    const commentCount = video.statistics?.commentCount || 0;

    let rankClass = '';
    if (rank === 1) rankClass = 'rank-1';
    else if (rank === 2) rankClass = 'rank-2';
    else if (rank === 3) rankClass = 'rank-3';

    item.innerHTML = `
      <div class="video-rank ${rankClass}">${rank}</div>
      <div class="top-video-thumbnail">
        <img src="${thumbnail}" alt="${video.title}" loading="lazy">
      </div>
      <div class="top-video-info">
        <h4 class="top-video-title">${video.title}</h4>
        <div class="top-video-stats">
          <div class="top-video-stat">
            <i class="fas fa-eye"></i>
            <span>${formatNumber(viewCount)}</span>
          </div>
          <div class="top-video-stat">
            <i class="fas fa-thumbs-up"></i>
            <span>${formatNumber(likeCount)}</span>
          </div>
          <div class="top-video-stat">
            <i class="fas fa-comment"></i>
            <span>${formatNumber(commentCount)}</span>
          </div>
          <div class="top-video-stat">
            <i class="fas fa-calendar"></i>
            <span>${publishedDate}</span>
          </div>
        </div>
      </div>
    `;

    item.addEventListener('click', () => {
      window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
    });

    return item;
  }
}