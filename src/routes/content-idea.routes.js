import express from 'express';
import { ContentIdeaService } from '../services/content-idea-service.js';
import { YouTubeService } from '../services/youtube-service.js';
import { createErrorResponse } from '../utils/errors.js';
import { config } from '../config/config.js';

const router = express.Router();
const contentIdeaService = new ContentIdeaService();
const youtubeService = new YouTubeService();

// Generate content ideas
router.post('/generate', async (req, res) => {
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

// Generate custom video idea
router.post('/custom', async (req, res) => {
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

// Generate AI channel video idea
router.post('/ai-channel', async (req, res) => {
    try {
        const { prompt, channelId, analysisData } = req.body;
        
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
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const customIdeaPromise = contentIdeaService.generateAIChannelVideoIdea(prompt, channelId, analysisData);
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

// Generate AI video ideas
router.post('/ai-video', async (req, res) => {
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
        
        const ideasPromise = contentIdeaService.generateVideoIdeasFromAnalysis(specificTopic);
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

// Generate comment-based content ideas
router.post('/from-comments', async (req, res) => {
    try {
        const { commentAnalysisData, channelVideos } = req.body;
        
        if (!commentAnalysisData) {
            return res.status(400).json({ 
                success: false,
                error: 'コメント分析データが必要です',
                message: 'コメント分析を先に実行してください' 
            });
        }

        console.log(`[${new Date().toISOString()}] Generating content ideas from comment analysis`);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const ideasPromise = contentIdeaService.analyzeFromCommentData(
            commentAnalysisData,
            channelVideos || []
        );
        
        const result = await Promise.race([ideasPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] Comment-based content ideas generated successfully`);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Comment-based content idea generation error:`, error);
        
        const errorResponse = createErrorResponse(error);
        res.status(errorResponse.statusCode).json({
            success: false,
            error: errorResponse.error,
            details: errorResponse.details
        });
    }
});

export { router as contentIdeaRoutes };