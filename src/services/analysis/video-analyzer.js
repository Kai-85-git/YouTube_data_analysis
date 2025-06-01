import { BaseGeminiService } from '../base/gemini-service.js';
import { YouTubeApiService } from '../youtube-api.js';
import { PerformanceAnalyzer } from './performance-analyzer.js';
import { YouTubeAnalyzerError } from '../../utils/errors.js';

export class VideoAnalyzer extends BaseGeminiService {
  constructor() {
    super();
    this.youtubeApi = new YouTubeApiService();
    this.performanceAnalyzer = new PerformanceAnalyzer();
  }

  async analyzeChannelVideos(channelId, maxVideos = 50) {
    try {
      console.log(`Fetching videos for channel: ${channelId}`);
      
      // Get channel videos
      const videos = await this.youtubeApi.getChannelVideos(channelId, maxVideos);
      
      if (!videos || videos.length === 0) {
        throw new YouTubeAnalyzerError('チャンネルの動画が見つかりませんでした', 'NO_VIDEOS_FOUND');
      }

      // Get video statistics
      const videoIds = videos.map(v => v.id.videoId);
      const videosWithStats = await this.youtubeApi.getVideoStatistics(videoIds);

      // Analyze performance
      const performanceAnalysis = this.performanceAnalyzer.analyzeVideoPerformance(videosWithStats);
      
      // Identify content patterns
      const contentPatterns = this.performanceAnalyzer.identifyContentPatterns(videosWithStats);

      // Get channel info
      const channelInfo = await this.youtubeApi.getChannelInfo(channelId);

      return {
        channelId,
        channelTitle: channelInfo.snippet?.title || 'Unknown Channel',
        channelDescription: channelInfo.snippet?.description,
        analysis: performanceAnalysis,
        patterns: contentPatterns,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Video analysis error:', error);
      throw new YouTubeAnalyzerError(
        error.message || 'ビデオ分析中にエラーが発生しました',
        error.code || 'VIDEO_ANALYSIS_ERROR'
      );
    }
  }

  async generateVideoIdeasFromAnalysis(analysisData) {
    const prompt = this.formatPromptWithJSON(
      `以下のYouTubeチャンネルの分析データを基に、新しい動画のアイデアを5つ生成してください。

チャンネル情報:
- チャンネル名: ${analysisData.channelTitle}
- 総動画数: ${analysisData.analysis.totalVideos}

パフォーマンス指標:
- 平均視聴回数: ${analysisData.analysis.averageMetrics.views}
- 平均エンゲージメント率: ${analysisData.analysis.averageMetrics.engagementRate}%

トップパフォーマンス動画:
${analysisData.analysis.topPerformers.byViews.slice(0, 3).map(v => 
  `- "${v.title}" (${v.views.toLocaleString()}回視聴)`
).join('\n')}

成功パターン:
- よく使われるキーワード: ${analysisData.patterns.bestPerformingTitles.slice(0, 5).map(t => t.word).join(', ')}

各アイデアには以下を含めてください:
1. タイトル案
2. 概要説明
3. なぜこのアイデアが成功する可能性があるか
4. ターゲット視聴者
5. 推定制作時間`,
      {
        ideas: [
          {
            title: "",
            description: "",
            whyItWorks: "",
            targetAudience: "",
            estimatedDuration: ""
          }
        ],
        rationale: ""
      }
    );

    try {
      const response = await this.generateWithFallback(prompt);
      return this.extractJSON(response);
    } catch (error) {
      console.error('Video idea generation failed:', error);
      throw new YouTubeAnalyzerError('動画アイデアの生成に失敗しました', 'IDEA_GENERATION_ERROR');
    }
  }

  async generateCustomVideoIdea(prompt, channelId = null, analysisData = null) {
    let contextInfo = '';
    
    if (channelId && !analysisData) {
      try {
        analysisData = await this.analyzeChannelVideos(channelId, 20);
      } catch (error) {
        console.warn('Failed to fetch channel data for context:', error);
      }
    }

    if (analysisData) {
      contextInfo = `
チャンネルコンテキスト:
- チャンネル名: ${analysisData.channelTitle || 'Unknown'}
- 平均視聴回数: ${analysisData.analysis?.averageMetrics?.views || 'N/A'}
- トップ動画: ${analysisData.analysis?.topPerformers?.byViews?.[0]?.title || 'N/A'}

`;
    }

    const fullPrompt = this.formatPromptWithJSON(
      `${contextInfo}ユーザーリクエスト: ${prompt}

上記のリクエストに基づいて、YouTube動画のアイデアを生成してください。`,
      {
        title: "",
        description: "",
        detailedContent: {
          introduction: "",
          mainPoints: [],
          conclusion: ""
        },
        targetAudience: "",
        estimatedDuration: "",
        requiredResources: [],
        potentialChallenges: [],
        expectedOutcome: ""
      }
    );

    try {
      const response = await this.generateWithFallback(fullPrompt);
      return this.extractJSON(response);
    } catch (error) {
      console.error('Custom video idea generation failed:', error);
      throw new YouTubeAnalyzerError('カスタム動画アイデアの生成に失敗しました', 'CUSTOM_IDEA_ERROR');
    }
  }
}