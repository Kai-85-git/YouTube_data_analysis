import { YouTubeApiService } from './youtube-api.js';
import { YouTubeAnalyzerError } from '../utils/errors.js';

/**
 * Service for managing YouTube Live Chat
 */
export class LiveChatService {
  constructor(apiKey) {
    this.apiService = new YouTubeApiService(apiKey);
    this.activeSessions = new Map(); // Store active polling sessions
  }

  /**
   * Get live chat ID from video ID or URL
   * @param {string} videoIdOrUrl - Video ID or YouTube URL
   * @returns {Promise<Object>} Live chat info
   */
  async initializeLiveChat(videoIdOrUrl) {
    try {
      // Extract video ID from URL if needed
      const videoId = this.extractVideoId(videoIdOrUrl);

      // Get video details to check if it's a live video
      const videoDetails = await this.apiService.getVideoDetails(videoId);

      // Get live chat ID
      const liveChatId = await this.apiService.getLiveChatId(videoId);

      if (!liveChatId) {
        throw new YouTubeAnalyzerError(
          'This video does not have an active live chat. The video might not be a live stream or the live chat might be disabled.',
          null,
          400
        );
      }

      return {
        videoId,
        liveChatId,
        videoTitle: videoDetails.snippet.title,
        channelTitle: videoDetails.snippet.channelTitle,
        isLive: videoDetails.snippet.liveBroadcastContent === 'live',
        scheduledStartTime: videoDetails.liveStreamingDetails?.scheduledStartTime,
        actualStartTime: videoDetails.liveStreamingDetails?.actualStartTime,
        concurrentViewers: videoDetails.liveStreamingDetails?.concurrentViewers
      };
    } catch (error) {
      if (error instanceof YouTubeAnalyzerError) {
        throw error;
      }
      throw new YouTubeAnalyzerError(`Failed to initialize live chat: ${error.message}`, error.code);
    }
  }

  /**
   * Get live chat messages (single fetch)
   * @param {string} liveChatId - Live chat ID
   * @param {string} pageToken - Page token for pagination (optional)
   * @returns {Promise<Object>} Chat messages
   */
  async getChatMessages(liveChatId, pageToken = null) {
    try {
      const response = await this.apiService.getLiveChatMessages(liveChatId, pageToken);

      // Format messages for easier consumption
      const formattedMessages = response.messages.map(msg => ({
        id: msg.id,
        type: msg.snippet.type,
        publishedAt: msg.snippet.publishedAt,
        message: msg.snippet.displayMessage || msg.snippet.textMessageDetails?.messageText || '',
        authorName: msg.authorDetails.displayName,
        authorChannelId: msg.authorDetails.channelId,
        authorProfileImageUrl: msg.authorDetails.profileImageUrl,
        isChatOwner: msg.authorDetails.isChatOwner,
        isChatSponsor: msg.authorDetails.isChatSponsor,
        isChatModerator: msg.authorDetails.isChatModerator,
        isVerified: msg.authorDetails.isVerified
      }));

      return {
        messages: formattedMessages,
        nextPageToken: response.nextPageToken,
        pollingIntervalMillis: response.pollingIntervalMillis,
        messageCount: formattedMessages.length
      };
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to get chat messages: ${error.message}`, error.code);
    }
  }

  /**
   * Extract video ID from YouTube URL or return as-is if already an ID
   * @param {string} videoIdOrUrl - Video ID or URL
   * @returns {string} Video ID
   */
  extractVideoId(videoIdOrUrl) {
    // If it's already a video ID (11 characters), return it
    if (/^[a-zA-Z0-9_-]{11}$/.test(videoIdOrUrl)) {
      return videoIdOrUrl;
    }

    // Extract from various URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = videoIdOrUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If no pattern matches, assume it's a video ID
    return videoIdOrUrl;
  }

  /**
   * Start polling for live chat messages (for real-time updates)
   * @param {string} liveChatId - Live chat ID
   * @param {Function} onMessage - Callback function for new messages
   * @param {Function} onError - Callback function for errors
   * @returns {string} Session ID for stopping the polling
   */
  startPolling(liveChatId, onMessage, onError) {
    const sessionId = `${liveChatId}_${Date.now()}`;
    let pageToken = null;
    let isPolling = true;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const response = await this.getChatMessages(liveChatId, pageToken);

        // Update page token for next poll
        pageToken = response.nextPageToken;

        // Call the callback with new messages
        if (response.messages.length > 0) {
          onMessage(response.messages);
        }

        // Schedule next poll based on recommended interval
        const interval = response.pollingIntervalMillis || 5000;
        setTimeout(poll, interval);
      } catch (error) {
        if (onError) {
          onError(error);
        }
        // Continue polling even on error, with a longer interval
        if (isPolling) {
          setTimeout(poll, 10000);
        }
      }
    };

    // Store session info
    this.activeSessions.set(sessionId, {
      liveChatId,
      isPolling: () => isPolling,
      stop: () => {
        isPolling = false;
        this.activeSessions.delete(sessionId);
      }
    });

    // Start polling
    poll();

    return sessionId;
  }

  /**
   * Stop polling for a specific session
   * @param {string} sessionId - Session ID returned from startPolling
   */
  stopPolling(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.stop();
    }
  }

  /**
   * Stop all active polling sessions
   */
  stopAllPolling() {
    for (const [sessionId, session] of this.activeSessions) {
      session.stop();
    }
    this.activeSessions.clear();
  }

  /**
   * Get list of active polling sessions
   * @returns {Array} Active session IDs
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.keys());
  }
}
