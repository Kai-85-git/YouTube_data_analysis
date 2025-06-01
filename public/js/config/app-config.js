/**
 * Centralized application configuration
 */
export const AppConfig = {
    // API endpoints
    endpoints: {
        analyze: '/api/analyze',
        commentAnalysis: '/api/comment-analysis',
        videoAnalysis: '/api/video-analysis',
        contentGeneration: '/api/content-generation'
    },

    // DOM selectors
    selectors: {
        // Main containers
        app: '#app',
        channelInfo: '#channelInfo',
        channelDetails: '#channelDetails',
        channelVideos: '#channelVideos',
        analysisResults: '#analysisResults',
        contentIdeasSection: '#contentIdeasSection',
        
        // Channel elements
        channelTitle: '#channelTitle',
        channelThumbnail: '#channelThumbnail',
        channelDescription: '#channelDescription',
        subscriberCount: '#subscriberCount',
        videoCount: '#videoCount',
        viewCount: '#viewCount',
        
        // UI elements
        analyzeBtn: '#analyzeBtn',
        urlInput: '#urlInput',
        resultSection: '#resultSection',
        errorMessage: '#errorMessage',
        loadingIndicator: '#loadingIndicator',
        
        // Analysis buttons
        analyzeCommentsBtn: '#analyzeCommentsBtn',
        analyzePerformanceBtn: '#analyzePerformanceBtn',
        generateIdeasBtn: '#generateIdeasBtn',
        generateVideoIdeasBtn: '#generateVideoIdeasBtn',
        
        // Result containers
        commentAnalysisResult: '#commentAnalysisResult',
        performanceAnalysisResult: '#performanceAnalysisResult',
        chartContainer: '#chartContainer',
        
        // Sections
        sections: {
            channelInfo: 'channelInfo',
            commentAnalysis: 'commentAnalysis',
            performanceAnalysis: 'performanceAnalysis',
            contentIdeas: 'contentIdeas'
        }
    },

    // Chart configuration
    charts: {
        defaultType: 'bar',
        defaultOptions: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        },
        colors: {
            primary: '#FF0000',
            secondary: '#282828',
            success: '#00C851',
            warning: '#ffbb33',
            info: '#33b5e5',
            danger: '#ff4444'
        }
    },

    // UI configuration
    ui: {
        animationDuration: 300,
        debounceDelay: 500,
        maxRetries: 3,
        retryDelay: 1000,
        messageTimeout: 5000,
        maxVideosToShow: 50,
        maxCommentsToAnalyze: 100
    },

    // Feature flags
    features: {
        enableVideoComments: true,
        enableAIIdeas: true,
        enableCharts: true,
        enableExport: false,
        enableCache: true
    },

    // Cache configuration
    cache: {
        ttl: 3600000, // 1 hour
        maxSize: 50
    }
};