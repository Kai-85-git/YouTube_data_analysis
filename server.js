import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { YouTubeAnalyzer } from './youtube-analyzer.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

// Check if API key is configured
if (!API_KEY) {
    console.error('❌ YouTube API key is not configured!');
    console.error('📝 Please follow these steps:');
    console.error('   1. Copy .env.example to .env');
    console.error('   2. Get your API key from: https://console.developers.google.com/');
    console.error('   3. Add your API key to the .env file');
    console.error('   4. Restart the server');
    process.exit(1);
}

app.use(cors());
app.use(express.json());

// Content Security Policy middleware
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self'"
    );
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

const analyzer = new YouTubeAnalyzer(API_KEY);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                success: false,
                error: 'URLが必要です',
                message: 'YouTubeチャンネルのURLを入力してください' 
            });
        }

        if (!url.includes('youtube.com')) {
            return res.status(400).json({ 
                success: false,
                error: '無効なURL',
                message: '有効なYouTubeチャンネルのURLを入力してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Analyzing channel: ${url}`);
        
        // Set a timeout for the analysis
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
        });
        
        const result = await Promise.race([
            analyzer.analyzeChannel(url),
            timeoutPromise
        ]);
        
        console.log(`[${new Date().toISOString()}] Analysis completed successfully`);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Analysis error:`, error);
        
        let errorMessage = 'チャンネルの分析中にエラーが発生しました';
        let statusCode = 500;
        
        if (error.message.includes('Channel not found')) {
            errorMessage = 'チャンネルが見つかりませんでした。URLを確認してください。';
            statusCode = 404;
        } else if (error.message.includes('Invalid YouTube channel URL')) {
            errorMessage = '無効なYouTubeチャンネルのURLです。正しい形式で入力してください。';
            statusCode = 400;
        } else if (error.message.includes('quota')) {
            errorMessage = 'API使用制限に達しました。しばらく時間をおいて再試行してください。';
            statusCode = 429;
        } else if (error.message.includes('timeout')) {
            errorMessage = 'リクエストがタイムアウトしました。ネットワーク接続を確認して再試行してください。';
            statusCode = 408;
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
            statusCode = 503;
        }
        
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'YouTube Channel Analyzer API'
    });
});

app.use((req, res) => {
    res.status(404).json({ 
        error: 'エンドポイントが見つかりません',
        message: '要求されたリソースは存在しません'
    });
});

app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'サーバーエラー',
        message: '内部サーバーエラーが発生しました'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 YouTube Channel Analyzer is ready!`);
    console.log(`🌐 Open your browser and navigate to http://localhost:${PORT}`);
});