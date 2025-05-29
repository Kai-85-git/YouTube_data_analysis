import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { YouTubeService } from './src/services/youtube-service.js';
import { validateApiKey, config } from './src/config/config.js';
import { createErrorResponse } from './src/utils/errors.js';
import { validateYouTubeUrl } from './src/utils/validators.js';
import { CommentAnalyzer } from './src/services/comment-analyzer.js';
import { ContentIdeaService } from './src/services/content-idea-service.js';
import { VideoAnalysisService } from './src/services/video-analysis-service.js';

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

app.use(express.static(path.join(__dirname, 'public')));

const youtubeService = new YouTubeService();
const commentAnalyzer = new CommentAnalyzer();
const contentIdeaService = new ContentIdeaService();
const videoAnalysisService = new VideoAnalysisService();

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
            youtubeService.analyzeChannel(url),
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

app.post('/api/analyze-comments', async (req, res) => {
    try {
        const { channelId } = req.body;
        
        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'チャンネルIDが必要です',
                message: 'チャンネルIDを指定してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Analyzing comments for channel: ${channelId}`);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const commentsPromise = youtubeService.apiService.getChannelComments(channelId);
        const comments = await Promise.race([commentsPromise, timeoutPromise]);
        
        const analysis = commentAnalyzer.analyzeComments(comments);
        
        console.log(`[${new Date().toISOString()}] Comment analysis completed successfully`);
        
        res.json({
            success: true,
            data: analysis
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Comment analysis error:`, error);
        
        const errorResponse = createErrorResponse(error);
        res.status(errorResponse.statusCode).json({
            success: false,
            error: errorResponse.error,
            details: errorResponse.details
        });
    }
});


app.post('/api/analyze-video-performance', async (req, res) => {
    try {
        const { channelId, maxVideos = 20 } = req.body;
        
        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'チャンネルIDが必要です',
                message: 'チャンネルIDを指定してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Analyzing video performance for channel: ${channelId}`);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const analysisPromise = videoAnalysisService.analyzeChannelVideos(channelId, maxVideos);
        const result = await Promise.race([analysisPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] Video performance analysis completed successfully`);
        console.log(`AI Analysis result:`, result.aiAnalysis ? 'Generated' : 'Failed');
        console.log(`Video Ideas result:`, result.videoIdeas ? 'Generated' : 'Failed');
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Video performance analysis error:`, error);
        
        const errorResponse = createErrorResponse(error);
        res.status(errorResponse.statusCode).json({
            success: false,
            error: errorResponse.error,
            details: errorResponse.details
        });
    }
});

app.post('/api/generate-ai-video-ideas', async (req, res) => {
    try {
        const { channelId, specificTopic } = req.body;
        
        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'チャンネルIDが必要です',
                message: 'チャンネルIDを指定してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Generating AI video ideas for channel: ${channelId}`);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const ideasPromise = videoAnalysisService.generateVideoIdeas(channelId, specificTopic);
        const result = await Promise.race([ideasPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] AI video ideas generated successfully`);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] AI video ideas generation error:`, error);
        
        const errorResponse = createErrorResponse(error);
        res.status(errorResponse.statusCode).json({
            success: false,
            error: errorResponse.error,
            details: errorResponse.details
        });
    }
});

app.post('/api/generate-content-ideas', async (req, res) => {
    try {
        const { channelId, comments, topVideos } = req.body;
        
        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'チャンネルIDが必要です',
                message: 'チャンネルIDを指定してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Generating content ideas for channel: ${channelId}`);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        let channelComments = comments;
        let channelVideos = topVideos;
        
        if (!channelComments) {
            channelComments = await youtubeService.apiService.getChannelComments(channelId);
        }
        
        if (!channelVideos) {
            const channelData = await youtubeService.apiService.getChannelVideos(channelId);
            channelVideos = channelData.slice(0, 10);
        }
        
        const viewerNeedsPromise = contentIdeaService.analyzeViewerNeeds(channelComments, channelVideos);
        const patternsPromise = contentIdeaService.analyzePopularPatterns(channelVideos);
        
        const [viewerNeeds, patterns] = await Promise.race([
            Promise.all([viewerNeedsPromise, patternsPromise]),
            timeoutPromise
        ]);
        
        const videoIdeas = await contentIdeaService.generateVideoIdeas(viewerNeeds, patterns);
        
        console.log(`[${new Date().toISOString()}] Content ideas generated successfully`);
        
        res.json({
            success: true,
            data: {
                viewerNeeds,
                patterns,
                videoIdeas
            }
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Content idea generation error:`, error);
        
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