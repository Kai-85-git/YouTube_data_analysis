import { LiveChatService } from './src/services/live-chat-service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function testLiveChat() {
    console.log('=== YouTube Live Chat Test ===\n');

    // Check API key
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
        console.error('❌ YouTube APIキーが設定されていません！');
        console.log('\n解決方法:');
        console.log('1. .envファイルを作成: cp .env.example .env');
        console.log('2. .envファイルを編集してYOUTUBE_API_KEYを設定');
        console.log('3. Google Cloud ConsoleでYouTube Data API v3を有効化してAPIキーを取得');
        console.log('   https://console.developers.google.com/');
        process.exit(1);
    }

    console.log('✅ YouTube APIキーが設定されています\n');

    // Test video URL
    const testUrl = 'https://www.youtube.com/watch?v=xnYdVbGocPw';
    console.log(`テスト動画URL: ${testUrl}\n`);

    try {
        const liveChatService = new LiveChatService(YOUTUBE_API_KEY);

        console.log('🔍 ライブチャット情報を取得中...\n');
        const chatInfo = await liveChatService.initializeLiveChat(testUrl);

        console.log('✅ ライブチャット情報の取得に成功！\n');
        console.log('=== 動画情報 ===');
        console.log(`動画ID: ${chatInfo.videoId}`);
        console.log(`ライブチャットID: ${chatInfo.liveChatId}`);
        console.log(`動画タイトル: ${chatInfo.videoTitle}`);
        console.log(`チャンネル: ${chatInfo.channelTitle}`);
        console.log(`ライブ配信中: ${chatInfo.isLive ? '🔴 はい' : '⏸️ いいえ'}`);
        console.log(`視聴者数: ${chatInfo.concurrentViewers || 'N/A'}`);

        console.log('\n🎯 チャットメッセージを取得中...\n');
        const messages = await liveChatService.getChatMessages(chatInfo.liveChatId);

        console.log(`✅ ${messages.messageCount}件のメッセージを取得しました\n`);

        if (messages.messageCount > 0) {
            console.log('=== 最新のチャットメッセージ（最大5件）===\n');
            messages.messages.slice(0, 5).forEach((msg, index) => {
                console.log(`[${index + 1}] ${msg.authorName}: ${msg.message}`);
                console.log(`   時刻: ${new Date(msg.publishedAt).toLocaleString('ja-JP')}`);
                const badges = [];
                if (msg.isChatOwner) badges.push('配信者');
                if (msg.isChatModerator) badges.push('モデレーター');
                if (msg.isChatSponsor) badges.push('スポンサー');
                if (msg.isVerified) badges.push('認証済み');
                if (badges.length > 0) {
                    console.log(`   バッジ: ${badges.join(', ')}`);
                }
                console.log('');
            });
        } else {
            console.log('メッセージがまだありません。配信が始まるとメッセージが表示されます。');
        }

        console.log('\n✅ テスト完了！');
        console.log('\nWebブラウザで以下のURLにアクセスしてください:');
        console.log('http://localhost:3000/live-chat.html\n');

    } catch (error) {
        console.error('\n❌ エラーが発生しました:\n');
        console.error(`エラー内容: ${error.message}\n`);

        if (error.message.includes('does not have an active live chat')) {
            console.log('このエラーの原因:');
            console.log('- 動画がライブ配信中ではない');
            console.log('- ライブチャットが無効になっている');
            console.log('- 配信が終了している');
            console.log('\n解決方法:');
            console.log('- 現在配信中のライブ動画URLを使用してください');
            console.log('- YouTubeで動画を開き、チャット欄が表示されているか確認してください');
        } else if (error.message.includes('API key')) {
            console.log('このエラーの原因:');
            console.log('- YouTube APIキーが無効');
            console.log('- APIキーの権限が不足');
            console.log('\n解決方法:');
            console.log('- Google Cloud ConsoleでAPIキーを確認してください');
            console.log('- YouTube Data API v3が有効化されているか確認してください');
        } else if (error.message.includes('quota')) {
            console.log('このエラーの原因:');
            console.log('- YouTube APIのクォータ制限に達しています');
            console.log('\n解決方法:');
            console.log('- Google Cloud Consoleでクォータ使用状況を確認してください');
            console.log('- 別のAPIキーを使用するか、翌日まで待ってください');
        }

        console.log('\n詳細なエラー情報:');
        console.error(error);
        process.exit(1);
    }
}

// Run test
testLiveChat();
