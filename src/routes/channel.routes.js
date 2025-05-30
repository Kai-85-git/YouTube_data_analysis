import express from 'express';
import { YouTubeService } from '../services/youtube-service.js';
import { validateYouTubeUrl } from '../utils/validators.js';
import { createErrorResponse } from '../utils/errors.js';
import { config } from '../config/config.js';

const router = express.Router();
const youtubeService = new YouTubeService();

// Analyze YouTube channel
router.post('/analyze', async (req, res) => {
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
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), config.server.timeout);
        });
        
        const analysisPromise = youtubeService.analyzeChannel(url);
        const data = await Promise.race([analysisPromise, timeoutPromise]);
        
        console.log(`[${new Date().toISOString()}] Analysis completed successfully`);
        
        res.json({
            success: true,
            data
        });
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Channel analysis error:`, error);
        
        const errorResponse = createErrorResponse(error);
        res.status(errorResponse.statusCode).json({
            success: false,
            error: errorResponse.error,
            details: errorResponse.details
        });
    }
});

export { router as channelRoutes };