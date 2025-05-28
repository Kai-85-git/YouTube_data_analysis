import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { YouTubeAnalyzer } from './src/services/youtube-analyzer.js';
import { validateApiKey, config } from './src/config/config.js';
import { createErrorResponse } from './src/utils/errors.js';
import { validateYouTubeUrl } from './src/utils/validators.js';

// Validate API key
validateApiKey();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

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

const analyzer = new YouTubeAnalyzer();

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

        const validation = validateYouTubeUrl(url);
        if (!validation.isValid) {
            return res.status(400).json({ 
                success: false,
                error: validation.error,
                message: '有効なYouTubeチャンネルのURLを入力してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Analyzing channel: ${url}`);
        
        // Set a timeout for the analysis
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
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
        
        const errorResponse = createErrorResponse(error);
        res.status(errorResponse.statusCode).json({
            success: false,
            error: errorResponse.error,
            details: errorResponse.details
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
    console.log(`📊 ${config.app.name} v${config.app.version} is ready!`);
    console.log(`🌐 Open your browser and navigate to http://localhost:${PORT}`);
});