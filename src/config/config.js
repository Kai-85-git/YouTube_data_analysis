import dotenv from 'dotenv';

dotenv.config();

export const config = {
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    maxResults: {
      default: 10,
      videos: 50,
      topVideos: 30
    }
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash'
  },
  server: {
    port: process.env.PORT || 3000,
    timeout: 120000 // 120秒（2分）に延長
  },
  app: {
    name: 'YouTube Channel Analyzer',
    version: '1.0.0'
  }
};

export function validateApiKey() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!config.youtube.apiKey) {
    console.warn('⚠️  YouTube API key is not configured!');
    if (!isProduction) {
      console.warn('📝 Please follow these steps:');
      console.warn('   1. Copy .env.example to .env');
      console.warn('   2. Get your API key from: https://console.developers.google.com/');
      console.warn('   3. Add your API key to the .env file');
      console.warn('   4. Restart the application');
    }
    console.warn('🔧 Running in demo mode without YouTube API access');
  }
  
  if (!config.gemini.apiKey) {
    console.warn('⚠️  Gemini API key is not configured!');
    if (!isProduction) {
      console.warn('📝 Please follow these steps:');
      console.warn('   1. Get your API key from: https://aistudio.google.com/app/apikey');
      console.warn('   2. Add GEMINI_API_KEY to your .env file');
      console.warn('   3. Restart the application');
    }
    console.warn('🔧 Running without AI features');
  }
  
  return config.youtube.apiKey;
}