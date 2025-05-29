import { google } from 'googleapis';
import { config } from '../config/config.js';
import { YouTubeAnalyzerError } from '../utils/errors.js';

export class YouTubeApiService {
  constructor(apiKey = config.youtube.apiKey) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
  }

  async getChannelByHandle(handle) {
    try {
      const response = await this.youtube.channels.list({
        part: 'id,snippet,statistics',
        forHandle: handle
      });
      return response.data.items[0] || null;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get channel by handle: ${error.message}`, error.code);
    }
  }

  async getChannelById(channelId) {
    try {
      const response = await this.youtube.channels.list({
        part: 'id,snippet,statistics,brandingSettings',
        id: channelId
      });
      return response.data.items[0] || null;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get channel by ID: ${error.message}`, error.code);
    }
  }

  async searchChannels(query) {
    try {
      const response = await this.youtube.search.list({
        part: 'id,snippet',
        q: query,
        type: 'channel',
        maxResults: 1
      });
      return response.data.items;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Channel search failed: ${error.message}`, error.code);
    }
  }

  async getChannelVideos(channelId, maxResults = config.youtube.maxResults.default) {
    try {
      const response = await this.youtube.search.list({
        part: 'id,snippet',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: maxResults
      });
      return response.data.items;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get channel videos: ${error.message}`, error.code);
    }
  }

  async getVideoStatistics(videoIds) {
    try {
      const response = await this.youtube.videos.list({
        part: 'statistics,contentDetails',
        id: videoIds.join(',')
      });
      return response.data.items;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get video statistics: ${error.message}`, error.code);
    }
  }

  async getUploadsPlaylist(channelId) {
    try {
      const response = await this.youtube.channels.list({
        part: 'contentDetails',
        id: channelId
      });
      
      if (!response.data.items.length) {
        throw new YouTubeAnalyzerError('Channel not found', null, 404);
      }
      
      return response.data.items[0].contentDetails.relatedPlaylists.uploads;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get uploads playlist: ${error.message}`, error.code);
    }
  }

  async getPlaylistVideos(playlistId, maxResults = config.youtube.maxResults.videos) {
    try {
      const response = await this.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: maxResults
      });
      return response.data.items;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get playlist videos: ${error.message}`, error.code);
    }
  }

  async getVideoComments(videoId, maxResults = 100) {
    try {
      const response = await this.youtube.commentThreads.list({
        part: 'snippet,replies',
        videoId: videoId,
        maxResults: maxResults,
        order: 'relevance'
      });
      return response.data.items;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get video comments: ${error.message}`, error.code);
    }
  }

  async getChannelComments(channelId, maxResults = 200) {
    try {
      const uploadsPlaylistId = await this.getUploadsPlaylist(channelId);
      const videos = await this.getPlaylistVideos(uploadsPlaylistId, 10);
      
      const allComments = [];
      for (const video of videos) {
        try {
          const comments = await this.getVideoComments(video.snippet.resourceId.videoId, 20);
          allComments.push(...comments.map(comment => ({
            ...comment,
            videoTitle: video.snippet.title,
            videoId: video.snippet.resourceId.videoId
          })));
        } catch (error) {
          console.warn(`Failed to get comments for video ${video.snippet.title}:`, error.message);
        }
      }
      
      return allComments;
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get channel comments: ${error.message}`, error.code);
    }
  }
}