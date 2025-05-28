import { google } from 'googleapis';

export class YouTubeAnalyzer {
  constructor(apiKey) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
  }

  extractChannelId(url) {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return { type: 'id', value: match[1] };
      }
    }
    
    throw new Error('Invalid YouTube channel URL');
  }

  async getChannelByHandle(handle) {
    try {
      const response = await this.youtube.channels.list({
        part: 'id,snippet,statistics',
        forHandle: handle
      });
      return response.data.items[0];
    } catch (error) {
      return null;
    }
  }

  async getChannelById(channelId) {
    const response = await this.youtube.channels.list({
      part: 'id,snippet,statistics,brandingSettings',
      id: channelId
    });
    return response.data.items[0];
  }

  async getChannelVideos(channelId, maxResults = 10) {
    const response = await this.youtube.search.list({
      part: 'id,snippet',
      channelId: channelId,
      type: 'video',
      order: 'date',
      maxResults: maxResults
    });
    return response.data.items;
  }

  async getVideoStatistics(videoIds) {
    const response = await this.youtube.videos.list({
      part: 'statistics,contentDetails',
      id: videoIds.join(',')
    });
    return response.data.items;
  }

  async getTopVideos(channelId, maxResults = 50) {
    try {
      // Get uploads playlist first
      const channelResponse = await this.youtube.channels.list({
        part: 'contentDetails',
        id: channelId
      });

      if (!channelResponse.data.items.length) {
        throw new Error('Channel not found');
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
      
      // Get videos from uploads playlist
      const playlistResponse = await this.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: maxResults
      });

      const videoIds = playlistResponse.data.items
        .map(item => item.snippet.resourceId.videoId)
        .filter(id => id);

      if (videoIds.length === 0) {
        return [];
      }

      const videoStats = await this.getVideoStatistics(videoIds);

      const videosWithStats = playlistResponse.data.items
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

  async getChannelAnalytics(channelId) {
    try {
      const playlistResponse = await this.youtube.channels.list({
        part: 'contentDetails',
        id: channelId
      });

      if (!playlistResponse.data.items.length) return null;

      const uploadsPlaylistId = playlistResponse.data.items[0].contentDetails.relatedPlaylists.uploads;
      
      const videosResponse = await this.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: 50
      });

      const videoIds = videosResponse.data.items.map(item => item.snippet.resourceId.videoId);
      const videoStats = await this.getVideoStatistics(videoIds);

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

      const uploadDays = videosResponse.data.items.map(item => 
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
      analytics.mostPopularDay = dayNames[mostPopularDayIndex];

      const uploads = videosResponse.data.items;
      if (uploads.length > 1) {
        const firstUpload = new Date(uploads[uploads.length - 1].snippet.publishedAt);
        const lastUpload = new Date(uploads[0].snippet.publishedAt);
        const daysDiff = Math.ceil((lastUpload - firstUpload) / (1000 * 60 * 60 * 24));
        analytics.uploadFrequency = Math.round(daysDiff / uploads.length);
      }

      return analytics;
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }

  async analyzeChannel(url) {
    try {
      console.log(`Starting analysis for URL: ${url}`);
      
      const { value } = this.extractChannelId(url);
      let channel;

      console.log(`Extracted value: ${value}`);

      if (url.includes('/@') || url.includes('/c/') || url.includes('/user/')) {
        console.log('Trying to get channel by handle...');
        channel = await this.getChannelByHandle(value);
        if (!channel) {
          console.log('Handle not found, searching...');
          const searchResponse = await this.youtube.search.list({
            part: 'id,snippet',
            q: value,
            type: 'channel',
            maxResults: 1
          });
          if (searchResponse.data.items.length > 0) {
            const channelId = searchResponse.data.items[0].id.channelId;
            channel = await this.getChannelById(channelId);
          }
        }
      } else {
        console.log('Getting channel by ID...');
        channel = await this.getChannelById(value);
      }

      if (!channel) {
        throw new Error('Channel not found');
      }

      console.log(`Found channel: ${channel.snippet.title}`);

      // Get basic data first
      const videos = await this.getChannelVideos(channel.id).catch(error => {
        console.error('Error getting recent videos:', error);
        return [];
      });

      // Get advanced data with fallbacks
      const [topVideos, analytics] = await Promise.allSettled([
        this.getTopVideos(channel.id, 30),
        this.getChannelAnalytics(channel.id)
      ]);

      const result = {
        channel: {
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
        },
        recentVideos: videos.map(video => ({
          id: video.id.videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: video.snippet.publishedAt,
          thumbnails: video.snippet.thumbnails
        })),
        topVideos: topVideos.status === 'fulfilled' ? topVideos.value.slice(0, 10) : [],
        analytics: analytics.status === 'fulfilled' ? analytics.value : null
      };

      console.log('Analysis completed successfully');
      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  formatAnalysis(data) {
    const { channel, recentVideos } = data;
    
    console.log('\n=== YouTube Channel Analysis ===\n');
    console.log(`📺 Channel: ${channel.title}`);
    console.log(`🆔 Channel ID: ${channel.id}`);
    console.log(`📅 Created: ${new Date(channel.publishedAt).toLocaleDateString()}`);
    
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
      console.log(`      📅 ${new Date(video.publishedAt).toLocaleDateString()}`);
    });
    
    console.log('\n=================================\n');
  }
}