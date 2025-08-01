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
import { GeminiCommentAnalyzer } from './src/services/gemini-comment-analyzer.js';
import { findAvailablePort } from './src/utils/port-finder.js';

// Validate API key
validateApiKey();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

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

app.use(express.static(path.join(__dirname, 'public')));


let youtubeService = null;
let videoAnalysisService = null;
let geminiCommentAnalyzer = null;
const commentAnalyzer = new CommentAnalyzer();
let contentIdeaService = null;

// ContentIdeaServiceの初期化を試みる
try {
    contentIdeaService = new ContentIdeaService();
} catch (error) {
    console.warn('ContentIdeaService initialization failed:', error.message);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { url, youtubeApiKey, geminiApiKey } = req.body;
        
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
        
        // APIキーが提供されている場合は使用、なければ環境変数から取得
        const apiKey = youtubeApiKey || process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ 
                success: false,
                error: 'YouTube APIキーが必要です',
                message: 'YouTube APIキーを設定してください' 
            });
        }
        
        // YouTube serviceインスタンスを作成
        youtubeService = new YouTubeService(apiKey);
        
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

app.post('/api/analyze-video-comments', async (req, res) => {
    try {
        const { videoId, youtubeApiKey, geminiApiKey } = req.body;
        
        if (!videoId) {
            return res.status(400).json({ 
                success: false,
                error: '動画IDが必要です',
                message: '動画IDを指定してください' 
            });
        }

        if (!youtubeApiKey) {
            return res.status(400).json({
                success: false,
                error: 'YouTube APIキーが必要です',
                message: 'YouTube APIキーを設定してください'
            });
        }

        if (!geminiApiKey) {
            return res.status(400).json({
                success: false,
                error: 'Gemini APIキーが必要です',
                message: 'Gemini APIキーを設定してください'
            });
        }

        // Initialize services if not already done
        if (!youtubeService) {
            youtubeService = new YouTubeService(youtubeApiKey);
        }
        
        if (!geminiCommentAnalyzer) {
            geminiCommentAnalyzer = new GeminiCommentAnalyzer(geminiApiKey);
        }

        console.log(`[${new Date().toISOString()}] Analyzing comments for video: ${videoId}`);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        // Get comments for the specific video
        const commentsPromise = youtubeService.apiService.getVideoComments(videoId, 100);
        const comments = await Promise.race([commentsPromise, timeoutPromise]);
        
        // Get video info
        const videoInfoPromise = youtubeService.apiService.getVideoStatistics([videoId]);
        const videoInfo = await Promise.race([videoInfoPromise, timeoutPromise]);
        const videoTitle = videoInfo[0]?.snippet?.title || '動画';
        
        // Use Gemini to analyze comments
        const analysisPromise = geminiCommentAnalyzer.analyzeVideoComments(comments, videoTitle);
        const analysis = await Promise.race([analysisPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] Video comment analysis with Gemini completed successfully`);
        
        res.json({
            success: true,
            data: {
                ...analysis,
                videoTitle: videoTitle,
                videoId: videoId
            }
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Video comment analysis error:`, error);
        
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
        const { channelId, maxVideos = 20, youtubeApiKey, geminiApiKey } = req.body;
        
        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'チャンネルIDが必要です',
                message: 'チャンネルIDを指定してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Analyzing video performance for channel: ${channelId}`);
        
        // APIキーが提供されている場合は使用、なければ環境変数から取得
        const ytApiKey = youtubeApiKey || process.env.YOUTUBE_API_KEY;
        const gmApiKey = geminiApiKey || process.env.GEMINI_API_KEY;
        
        if (!ytApiKey || !gmApiKey) {
            return res.status(400).json({ 
                success: false,
                error: 'APIキーが必要です',
                message: 'YouTube APIキーとGemini APIキーを設定してください' 
            });
        }
        
        // VideoAnalysisServiceインスタンスを作成
        videoAnalysisService = new VideoAnalysisService(ytApiKey, gmApiKey);
        
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
        const { channelId, specificTopic, youtubeApiKey, geminiApiKey } = req.body;
        
        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'チャンネルIDが必要です',
                message: 'チャンネルIDを指定してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Generating AI video ideas for channel: ${channelId}`);
        
        // APIキーが提供されている場合は使用、なければ環境変数から取得
        const ytApiKey = youtubeApiKey || process.env.YOUTUBE_API_KEY;
        const gmApiKey = geminiApiKey || process.env.GEMINI_API_KEY;
        
        if (!ytApiKey || !gmApiKey) {
            return res.status(400).json({ 
                success: false,
                error: 'APIキーが必要です',
                message: 'YouTube APIキーとGemini APIキーを設定してください' 
            });
        }
        
        // VideoAnalysisServiceインスタンスを作成
        videoAnalysisService = new VideoAnalysisService(ytApiKey, gmApiKey);
        
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

app.post('/api/generate-ai-channel-video-idea', async (req, res) => {
    try {
        const { prompt, channelId, analysisData, youtubeApiKey, geminiApiKey } = req.body;
        
        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ 
                success: false,
                error: 'プロンプトが必要です',
                message: '動画アイデアの説明を入力してください' 
            });
        }

        if (!channelId) {
            return res.status(400).json({ 
                success: false,
                error: 'チャンネルIDが必要です',
                message: 'チャンネル分析を先に実行してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Generating AI channel video idea for channel: ${channelId}`);
        
        // APIキーが提供されている場合は新しいインスタンスを作成
        const ideaService = (youtubeApiKey || geminiApiKey) 
            ? new ContentIdeaService(youtubeApiKey, geminiApiKey) 
            : contentIdeaService;
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const customIdeaPromise = ideaService.generateAIChannelVideoIdea(prompt, channelId, analysisData);
        const customIdea = await Promise.race([customIdeaPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] AI channel video idea generated successfully`);
        
        res.json({
            success: true,
            data: customIdea
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] AI channel video idea generation error:`, error);
        
        const errorResponse = createErrorResponse(error);
        res.status(errorResponse.statusCode).json({
            success: false,
            error: errorResponse.error,
            details: errorResponse.details
        });
    }
});

app.post('/api/generate-custom-video-idea', async (req, res) => {
    try {
        const { prompt, channelContext } = req.body;
        
        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({ 
                success: false,
                error: 'プロンプトが必要です',
                message: '動画アイデアの説明を入力してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Generating custom video idea with prompt: ${prompt}`);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const customIdeaPromise = contentIdeaService.generateCustomVideoIdea(prompt, channelContext);
        const customIdea = await Promise.race([customIdeaPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] Custom video idea generated successfully`);
        
        res.json({
            success: true,
            data: customIdea
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Custom video idea generation error:`, error);
        
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

// Startup logging
console.log('🔄 Starting server...');
console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📊 ${config.app.name} v${config.app.version}`);

// Find available port and start server
findAvailablePort(PORT)
  .then(availablePort => {
    app.listen(availablePort, '0.0.0.0', () => {
      console.log(`✅ Server successfully started on port ${availablePort}`);
      console.log(`🌐 Server is listening on all interfaces (0.0.0.0:${availablePort})`);
      console.log(`🌐 Application available at: http://localhost:${availablePort}`);
      
      if (availablePort !== PORT) {
        console.log(`⚠️  Originally tried port ${PORT}, but used ${availablePort} instead`);
      }
    });
  })
  .catch(error => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });