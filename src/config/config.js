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
    model: 'gemini-1.5-flash'
  },
  server: {
    port: process.env.PORT || 3000,
    timeout: 30000
  },
  app: {
    name: 'YouTube Channel Analyzer',
    version: '1.0.0'
  }
};

export function validateApiKey() {
  if (!config.youtube.apiKey) {
    console.error('❌ YouTube API key is not configured!');
    console.error('📝 Please follow these steps:');
    console.error('   1. Copy .env.example to .env');
    console.error('   2. Get your API key from: https://console.developers.google.com/');
    console.error('   3. Add your API key to the .env file');
    console.error('   4. Restart the application');
    process.exit(1);
  }
  
  if (!config.gemini.apiKey) {
    console.error('❌ Gemini API key is not configured!');
    console.error('📝 Please follow these steps:');
    console.error('   1. Get your API key from: https://aistudio.google.com/app/apikey');
    console.error('   2. Add GEMINI_API_KEY to your .env file');
    console.error('   3. Restart the application');
    process.exit(1);
  }
  
  return config.youtube.apiKey;
}