import { APP_CONSTANTS } from '../config/constants.js';

/**
 * 統一エラーハンドラー
 */
export class ErrorHandler {
    /**
     * エラーを処理して適切なメッセージを返す
     */
    static handle(error) {
        console.error('Error occurred:', error);

        // ネットワークエラー
        if (error.message === 'Failed to fetch' || error.name === 'NetworkError') {
            return {
                message: APP_CONSTANTS.ERROR_MESSAGES.NETWORK,
                type: 'network',
                details: error.message,
            };
        }

        // タイムアウトエラー
        if (error.message.includes('timeout') || error.message.includes('タイムアウト')) {
            return {
                message: APP_CONSTANTS.ERROR_MESSAGES.TIMEOUT,
                type: 'timeout',
                details: error.message,
            };
        }

        // APIキーエラー
        if (error.message.includes('API key') || error.message.includes('APIキー')) {
            return {
                message: APP_CONSTANTS.ERROR_MESSAGES.API_KEY_MISSING,
                type: 'api_key',
                details: error.message,
            };
        }

        // レート制限エラー
        if (error.message.includes('quota') || error.message.includes('rate limit')) {
            return {
                message: APP_CONSTANTS.ERROR_MESSAGES.RATE_LIMIT,
                type: 'rate_limit',
                details: error.message,
            };
        }

        // サーバーエラー
        if (error.message.includes('500') || error.message.includes('サーバーエラー')) {
            return {
                message: APP_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR,
                type: 'server',
                details: error.message,
            };
        }

        // その他のエラー
        return {
            message: error.message || APP_CONSTANTS.ERROR_MESSAGES.UNKNOWN,
            type: 'unknown',
            details: error.toString(),
        };
    }

    /**
     * ユーザーフレンドリーなエラーメッセージを生成
     */
    static getUserMessage(error) {
        const handled = this.handle(error);
        return handled.message;
    }

    /**
     * 開発環境用の詳細エラー情報を取得
     */
    static getDetailedError(error) {
        const handled = this.handle(error);
        return {
            ...handled,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * グローバルエラーハンドリング
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    event.preventDefault();
});

window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error);
    event.preventDefault();
});