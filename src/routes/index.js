import express from 'express';
import analyzeHandler from '../../api/analyze.js';
import commentAnalysisHandler from '../../api/comment-analysis.js';
import videoAnalysisHandler from '../../api/video-analysis.js';
import contentGenerationHandler from '../../api/content-generation.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'YouTube Channel Analyzer API'
    });
});

// New consolidated endpoints
router.post('/analyze', analyzeHandler);
router.post('/comment-analysis', commentAnalysisHandler);
router.post('/video-analysis', videoAnalysisHandler);
router.post('/content-generation', contentGenerationHandler);

// Legacy route support (for backward compatibility)
router.post('/channel/analyze', analyzeHandler);
router.post('/analysis/comments', async (req, res) => {
    req.body = { type: 'channel', id: req.body.channelId };
    return commentAnalysisHandler(req, res);
});
router.post('/analysis/video-performance', async (req, res) => {
    req.body = { action: 'analyze-performance', ...req.body };
    return videoAnalysisHandler(req, res);
});
router.post('/ideas/generate', async (req, res) => {
    req.body = { action: 'generate-ideas', ...req.body };
    return contentGenerationHandler(req, res);
});

export { router as apiRoutes };