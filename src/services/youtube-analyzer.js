import { ChannelService } from './channel-service.js';
import { AnalyticsService } from './analytics-service.js';
import { validateYouTubeUrl } from '../utils/validators.js';
import { formatDate } from '../utils/formatters.js';

export class YouTubeAnalyzer {
  constructor() {
    this.channelService = new ChannelService();
    this.analyticsService = new AnalyticsService();
  }

  async analyzeChannel(url) {
    console.log(`Starting analysis for URL: ${url}`);
    
    // Validate URL
    const validation = validateYouTubeUrl(url);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Find channel
    const channel = await this.channelService.findChannel(url);
    
    // Get recent videos
    const recentVideos = await this.channelService.getRecentVideos(channel.id);

    // Get advanced analytics with fallbacks
    const [topVideos, analytics] = await Promise.allSettled([
      this.analyticsService.getTopVideos(channel.id),
      this.analyticsService.getChannelAnalytics(channel.id)
    ]);

    const result = {
      channel: this.channelService.formatChannelData(channel),
      recentVideos: recentVideos,
      topVideos: topVideos.status === 'fulfilled' ? topVideos.value.slice(0, 10) : [],
      analytics: analytics.status === 'fulfilled' ? analytics.value : null
    };

    console.log('Analysis completed successfully');
    return result;
  }

  formatAnalysis(data) {
    const { channel, recentVideos } = data;
    
    console.log('\n=== YouTube Channel Analysis ===\n');
    console.log(`📺 Channel: ${channel.title}`);
    console.log(`🆔 Channel ID: ${channel.id}`);
    console.log(`📅 Created: ${formatDate(channel.publishedAt)}`);
    
    if (channel.customUrl) {
      console.log(`🔗 Custom URL: ${channel.customUrl}`);
    }
    
    console.log('\n📊 Statistics:');
    console.log(`   👥 Subscribers: ${channel.statistics.subscriberCount.toLocaleString()}`);
    console.log(`   👀 Total Views: ${channel.statistics.viewCount.toLocaleString()}`);
    console.log(`   🎬 Videos: ${channel.statistics.videoCount.toLocaleString()}`);
    
    console.log('\n📝 Description:');
    console.log(`   ${channel.description.substring(0, 200)}${channel.description.length > 200 ? '...' : ''}`);
    
    console.log('\n🎥 Recent Videos:');
    recentVideos.slice(0, 5).forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title}`);
      console.log(`      📅 ${formatDate(video.publishedAt)}`);
    });
    
    console.log('\n=================================\n');
  }
}