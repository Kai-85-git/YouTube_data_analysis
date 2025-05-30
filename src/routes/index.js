import express from 'express';
import { channelRoutes } from './channel.routes.js';
import { analysisRoutes } from './analysis.routes.js';
import { contentIdeaRoutes } from './content-idea.routes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'YouTube Channel Analyzer API'
    });
});

// Mount route modules
router.use('/channel', channelRoutes);
router.use('/analysis', analysisRoutes);
router.use('/ideas', contentIdeaRoutes);

export { router as apiRoutes };