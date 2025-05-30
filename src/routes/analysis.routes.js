import express from 'express';
import { CommentAnalyzer } from '../services/comment-analyzer.js';
import { VideoAnalysisService } from '../services/video-analysis-service.js';
import { createErrorResponse } from '../utils/errors.js';
import { config } from '../config/config.js';

const router = express.Router();
const commentAnalyzer = new CommentAnalyzer();
const videoAnalysisService = new VideoAnalysisService();

// Analyze comments
router.post('/comments', async (req, res) => {
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
        
        const analysisPromise = commentAnalyzer.analyzeChannelComments(channelId);
        const result = await Promise.race([analysisPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] Comment analysis completed successfully`);
        
        res.json({
            success: true,
            data: result
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

// Analyze video performance
router.post('/video-performance', async (req, res) => {
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

export { router as analysisRoutes };