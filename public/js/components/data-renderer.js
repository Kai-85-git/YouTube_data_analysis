// データレンダラー統合クラス - 新しいコンポーネントの統合インターフェース
import { ChannelRenderer } from './channel-renderer.js';
import { StatisticsRenderer } from './statistics-renderer.js';
import { VideoRenderer } from './video-renderer.js';

export class DataRenderer {
  constructor() {
    this.channelRenderer = new ChannelRenderer();
    this.statisticsRenderer = new StatisticsRenderer();
    this.videoRenderer = new VideoRenderer();
  }

  populateChannelInfo(channel) {
    this.channelRenderer.populateChannelInfo(channel);
  }

  populateStatistics(stats) {
    this.statisticsRenderer.populateStatistics(stats);
  }

  populateVideos(videos) {
    this.videoRenderer.populateVideos(videos);
  }

  populateTopVideos(topVideos) {
    this.videoRenderer.populateTopVideos(topVideos);
  }

  populateAnalytics(analytics) {
    this.statisticsRenderer.populateAnalytics(analytics);
  }

  clearAnimations() {
    this.statisticsRenderer.clearAnimations();
  }
}