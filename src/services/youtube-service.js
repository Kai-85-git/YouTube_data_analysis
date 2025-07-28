// 統合されたYouTubeサービス - チャンネル検索、動画取得、分析機能を統合
import { YouTubeApiService } from './youtube-api.js';
import { extractChannelInfo } from '../utils/validators.js';
import { YouTubeAnalyzerError } from '../utils/errors.js';
import { config } from '../config/config.js';

export class YouTubeService {
  constructor(apiKey) {
    this.apiService = new YouTubeApiService(apiKey);
  }

  // チャンネル検索機能
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

  // 最新動画取得
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

  // トップ動画取得
  async getTopVideos(channelId, maxResults = config.youtube.maxResults.topVideos) {
    try {
      const uploadsPlaylistId = await this.apiService.getUploadsPlaylist(channelId);
      const playlistVideos = await this.apiService.getPlaylistVideos(uploadsPlaylistId, maxResults);

      const videoIds = playlistVideos
        .map(item => item.snippet.resourceId.videoId)
        .filter(id => id);

      if (videoIds.length === 0) {
        return [];
      }

      const videoStats = await this.apiService.getVideoStatistics(videoIds);

      const videosWithStats = playlistVideos
        .map(video => {
          const videoId = video.snippet.resourceId.videoId;
          const stats = videoStats.find(stat => stat.id === videoId);
          return {
            id: videoId,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            thumbnails: video.snippet.thumbnails,
            statistics: stats ? {
              viewCount: parseInt(stats.statistics.viewCount || 0),
              likeCount: parseInt(stats.statistics.likeCount || 0),
              commentCount: parseInt(stats.statistics.commentCount || 0)
            } : {
              viewCount: 0,
              likeCount: 0,
              commentCount: 0
            },
            duration: stats ? stats.contentDetails.duration : null
          };
        })
        .filter(video => video.statistics);

      return videosWithStats.sort((a, b) => (b.statistics?.viewCount || 0) - (a.statistics?.viewCount || 0));
    } catch (error) {
      console.error('Error fetching top videos:', error);
      return [];
    }
  }

  // チャンネル分析
  async getChannelAnalytics(channelId) {
    try {
      const uploadsPlaylistId = await this.apiService.getUploadsPlaylist(channelId);
      const videosResponse = await this.apiService.getPlaylistVideos(uploadsPlaylistId, 50);

      const videoIds = videosResponse.map(item => item.snippet.resourceId.videoId);
      const videoStats = await this.apiService.getVideoStatistics(videoIds);

      const analytics = {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        averageViews: 0,
        mostPopularDay: null,
        uploadFrequency: null
      };

      videoStats.forEach(video => {
        analytics.totalViews += parseInt(video.statistics.viewCount || 0);
        analytics.totalLikes += parseInt(video.statistics.likeCount || 0);
        analytics.totalComments += parseInt(video.statistics.commentCount || 0);
      });

      analytics.averageViews = Math.round(analytics.totalViews / videoStats.length);
      analytics.mostPopularDay = this.calculateMostPopularDay(videosResponse);
      analytics.uploadFrequency = this.calculateUploadFrequency(videosResponse);

      return analytics;
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }

  // 完全なチャンネル分析
  async analyzeChannel(url) {
    try {
      console.log(`Starting analysis for URL: ${url}`);
      
      const channel = await this.findChannel(url);
      
      // 基本データを並行して取得
      const [recentVideos, topVideos, analytics] = await Promise.allSettled([
        this.getRecentVideos(channel.id),
        this.getTopVideos(channel.id, 30),
        this.getChannelAnalytics(channel.id)
      ]);

      const result = {
        channel: this.formatChannelData(channel),
        recentVideos: recentVideos.status === 'fulfilled' ? recentVideos.value : [],
        topVideos: topVideos.status === 'fulfilled' ? topVideos.value.slice(0, 10) : [],
        analytics: analytics.status === 'fulfilled' ? analytics.value : null
      };

      console.log('Analysis completed successfully');
      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      throw new YouTubeAnalyzerError(`Analysis failed: ${error.message}`);
    }
  }

  // ヘルパーメソッド
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

  calculateMostPopularDay(videos) {
    const uploadDays = videos.map(item => 
      new Date(item.snippet.publishedAt).getDay()
    );

    const dayCount = uploadDays.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const mostPopularDayIndex = Object.keys(dayCount).reduce((a, b) => 
      dayCount[a] > dayCount[b] ? a : b
    );

    const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    return dayNames[mostPopularDayIndex];
  }

  calculateUploadFrequency(uploads) {
    if (uploads.length <= 1) return null;

    const firstUpload = new Date(uploads[uploads.length - 1].snippet.publishedAt);
    const lastUpload = new Date(uploads[0].snippet.publishedAt);
    const daysDiff = Math.ceil((lastUpload - firstUpload) / (1000 * 60 * 60 * 24));
    
    return Math.round(daysDiff / uploads.length);
  }
}