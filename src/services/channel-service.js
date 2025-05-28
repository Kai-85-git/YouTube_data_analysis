import { YouTubeApiService } from './youtube-api.js';
import { extractChannelInfo } from '../utils/validators.js';
import { YouTubeAnalyzerError } from '../utils/errors.js';

export class ChannelService {
  constructor() {
    this.apiService = new YouTubeApiService();
  }

  async findChannel(url) {
    console.log(`Starting channel lookup for URL: ${url}`);
    
    const { type, value } = extractChannelInfo(url);
    let channel;

    console.log(`Extracted ${type}: ${value}`);

    if (type === 'handle' || url.includes('/@') || url.includes('/c/') || url.includes('/user/')) {
      console.log('Trying to get channel by handle...');
      channel = await this.apiService.getChannelByHandle(value);
      
      if (!channel) {
        console.log('Handle not found, searching...');
        const searchResults = await this.apiService.searchChannels(value);
        if (searchResults.length > 0) {
          const channelId = searchResults[0].id.channelId;
          channel = await this.apiService.getChannelById(channelId);
        }
      }
    } else {
      console.log('Getting channel by ID...');
      channel = await this.apiService.getChannelById(value);
    }

    if (!channel) {
      throw new YouTubeAnalyzerError('Channel not found', null, 404);
    }

    console.log(`Found channel: ${channel.snippet.title}`);
    return channel;
  }

  async getRecentVideos(channelId, maxResults = 10) {
    try {
      const videos = await this.apiService.getChannelVideos(channelId, maxResults);
      return videos.map(video => ({
        id: video.id.videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails
      }));
    } catch (error) {
      console.error('Error getting recent videos:', error);
      return [];
    }
  }

  formatChannelData(channel) {
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      publishedAt: channel.snippet.publishedAt,
      thumbnails: channel.snippet.thumbnails,
      customUrl: channel.snippet.customUrl,
      statistics: {
        viewCount: parseInt(channel.statistics.viewCount || 0),
        subscriberCount: parseInt(channel.statistics.subscriberCount || 0),
        videoCount: parseInt(channel.statistics.videoCount || 0)
      }
    };
  }
}