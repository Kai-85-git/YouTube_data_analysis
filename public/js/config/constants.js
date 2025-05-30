/**
 * アプリケーション定数
 */
export const APP_CONSTANTS = {
    // API設定
    API: {
        TIMEOUT: 45000, // 45秒
        EXTENDED_TIMEOUT: 60000, // 60秒
        MAX_RETRIES: 3,
    },

    // UI設定
    UI: {
        ANIMATION_DURATION: 2000,
        ANIMATION_STEPS: 60,
        MESSAGE_DISPLAY_TIME: 3000,
        DEBOUNCE_DELAY: 300,
    },

    // バリデーション
    VALIDATION: {
        MIN_PROMPT_LENGTH: 10,
        MAX_PROMPT_LENGTH: 500,
        YOUTUBE_URL_PATTERNS: [
            /youtube\.com\/channel\//,
            /youtube\.com\/c\//,
            /youtube\.com\/user\//,
            /youtube\.com\/@/,
        ],
    },

    // エラーメッセージ
    ERROR_MESSAGES: {
        NETWORK: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
        TIMEOUT: 'リクエストがタイムアウトしました。しばらく待ってから再試行してください。',
        INVALID_URL: '有効なYouTubeチャンネルのURLを入力してください。',
        API_KEY_MISSING: 'YouTube API キーが設定されていません。',
        RATE_LIMIT: 'APIの利用制限に達しました。しばらく待ってから再試行してください。',
        SERVER_ERROR: 'サーバーエラーが発生しました。',
        UNKNOWN: '予期しないエラーが発生しました。',
    },

    // 成功メッセージ
    SUCCESS_MESSAGES: {
        DATA_EXPORTED: 'データをエクスポートしました！',
        IDEA_SAVED: 'アイデアを保存しました！',
        ANALYSIS_COMPLETE: '分析が完了しました！',
    },

    // チャート設定
    CHART: {
        COLORS: {
            PRIMARY: '#667eea',
            SECONDARY: '#764ba2',
            SUCCESS: '#48bb78',
            WARNING: '#f6ad55',
            DANGER: '#fc8181',
        },
        DEFAULT_OPTIONS: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                },
            },
        },
    },

    // ローカルストレージキー
    STORAGE_KEYS: {
        LAST_SEARCH: 'youtube_analyzer_last_search',
        USER_PREFERENCES: 'youtube_analyzer_preferences',
        SAVED_IDEAS: 'youtube_analyzer_saved_ideas',
    },
};

// 環境設定
export const ENV = {
    isDevelopment: window.location.hostname === 'localhost',
    isProduction: window.location.hostname !== 'localhost',
};