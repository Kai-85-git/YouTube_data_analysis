/**
 * APIサービス - すべてのバックエンドAPIコールを管理
 */
export class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * HTTPリクエストの共通処理
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('リクエストがタイムアウトしました');
            }
            throw error;
        }
    }

    /**
     * タイムアウト付きリクエスト
     */
    async requestWithTimeout(endpoint, options = {}, timeout = 45000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await this.request(endpoint, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // チャンネル分析
    async analyzeChannel(url) {
        return this.requestWithTimeout('/analyze', {
            method: 'POST',
            body: JSON.stringify({ url }),
        });
    }

    // コメント分析
    async analyzeComments(channelId) {
        return this.requestWithTimeout('/comment-analysis', {
            method: 'POST',
            body: JSON.stringify({ type: 'channel', id: channelId }),
        }, 60000);
    }

    // 動画パフォーマンス分析
    async analyzeVideoPerformance(channelId, maxVideos = 30) {
        return this.requestWithTimeout('/video-analysis', {
            method: 'POST',
            body: JSON.stringify({ action: 'analyze-performance', channelId, maxVideos }),
        });
    }

    // コンテンツアイデア生成
    async generateContentIdeas(channelId, comments = null, topVideos = null) {
        return this.requestWithTimeout('/content-generation', {
            method: 'POST',
            body: JSON.stringify({ action: 'generate-ideas', channelId, comments, topVideos }),
        });
    }

    // カスタム動画アイデア生成
    async generateCustomVideoIdea(prompt, channelContext = null) {
        return this.requestWithTimeout('/content-generation', {
            method: 'POST',
            body: JSON.stringify({ action: 'generate-custom-idea', prompt, channelId: channelContext?.channelId }),
        });
    }

    // AIチャンネル動画アイデア生成
    async generateAIChannelVideoIdea(prompt, channelId, analysisData) {
        return this.requestWithTimeout('/video-analysis', {
            method: 'POST',
            body: JSON.stringify({ action: 'generate-custom-idea', prompt, channelId, analysisData }),
        });
    }

    // AI動画アイデア生成
    async generateAIVideoIdeas(channelId, specificTopic = null) {
        return this.requestWithTimeout('/video-analysis', {
            method: 'POST',
            body: JSON.stringify({ action: 'generate-ideas', channelId }),
        });
    }

    // 動画コメント分析
    async analyzeVideoComments(videoId) {
        return this.requestWithTimeout('/comment-analysis', {
            method: 'POST',
            body: JSON.stringify({ type: 'video', id: videoId }),
        }, 60000);
    }
}

// シングルトンインスタンスをエクスポート
export const apiService = new ApiService();