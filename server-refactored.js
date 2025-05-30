import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateApiKey, config } from './src/config/config.js';
import { apiRoutes } from './src/routes/index.js';

// Validate API key
validateApiKey();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Content Security Policy middleware
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "script-src-elem 'self' 'unsafe-inline' blob: data: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self'; " +
        "worker-src 'self' blob: data:; " +
        "child-src 'self' blob: data:; " +
        "object-src 'none';"
    );
    next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'エンドポイントが見つかりません',
        message: '要求されたリソースは存在しません'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'サーバーエラー',
        message: '内部サーバーエラーが発生しました'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 ${config.app.name} v${config.app.version} is ready!`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 API Key Status: ${process.env.YOUTUBE_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});