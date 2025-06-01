import { BaseGeminiService } from '../base/gemini-service.js';
import { YouTubeApiService } from '../youtube-api.js';
import { YouTubeAnalyzerError } from '../../utils/errors.js';

export class IdeaGenerator extends BaseGeminiService {
  constructor() {
    super();
    this.youtubeApi = new YouTubeApiService();
  }

  async generateIdeas(channelId, commentData = null, topVideos = null) {
    try {
      // Fetch channel information if not provided
      if (!topVideos) {
        const videos = await this.youtubeApi.getChannelVideos(channelId, 10);
        const videoIds = videos.map(v => v.id.videoId);
        topVideos = await this.youtubeApi.getVideoStatistics(videoIds);
      }

      const channelInfo = await this.youtubeApi.getChannelInfo(channelId);
      
      const prompt = this.buildIdeaGenerationPrompt(channelInfo, commentData, topVideos);
      const response = await this.generateWithFallback(prompt);
      
      return this.extractJSON(response);
    } catch (error) {
      console.error('Idea generation error:', error);
      
      // Return fallback ideas if AI generation fails
      return this.getFallbackIdeas(channelId);
    }
  }

  buildIdeaGenerationPrompt(channelInfo, commentData, topVideos) {
    let promptBase = `以下のYouTubeチャンネルの情報を基に、新しいコンテンツアイデアを生成してください。

チャンネル情報:
- 名前: ${channelInfo.snippet?.title || 'Unknown'}
- 説明: ${channelInfo.snippet?.description || 'なし'}
- 登録者数: ${channelInfo.statistics?.subscriberCount || '不明'}`;

    if (topVideos && topVideos.length > 0) {
      promptBase += `\n\n人気動画TOP3:\n`;
      topVideos.slice(0, 3).forEach((video, index) => {
        promptBase += `${index + 1}. ${video.snippet?.title} (${video.statistics?.viewCount || 0}回視聴)\n`;
      });
    }

    if (commentData) {
      promptBase += `\n\nコメント分析結果:\n`;
      if (commentData.sentiment) {
        promptBase += `- ポジティブ: ${commentData.sentiment.positive || 0}%\n`;
        promptBase += `- ネガティブ: ${commentData.sentiment.negative || 0}%\n`;
      }
      if (commentData.mainTopics && commentData.mainTopics.length > 0) {
        promptBase += `- 主なトピック: ${commentData.mainTopics.join(', ')}\n`;
      }
      if (commentData.viewerRequests && commentData.viewerRequests.length > 0) {
        promptBase += `- 視聴者からのリクエスト:\n`;
        commentData.viewerRequests.forEach(req => {
          promptBase += `  - ${req}\n`;
        });
      }
    }

    return this.formatPromptWithJSON(promptBase, {
      contentIdeas: [
        {
          title: "",
          description: "",
          format: "",
          estimatedLength: "",
          targetAudience: "",
          uniqueValue: ""
        }
      ],
      overallStrategy: ""
    });
  }

  getFallbackIdeas(channelId) {
    return {
      contentIdeas: [
        {
          title: "視聴者Q&A特集",
          description: "コメント欄から寄せられた質問に答える動画",
          format: "Q&A形式",
          estimatedLength: "10-15分",
          targetAudience: "既存の視聴者",
          uniqueValue: "視聴者との直接的な交流"
        },
        {
          title: "人気動画の舞台裏",
          description: "最も人気のある動画の制作過程を紹介",
          format: "Behind the scenes",
          estimatedLength: "8-12分",
          targetAudience: "コアファン",
          uniqueValue: "制作の裏側を知ることができる"
        },
        {
          title: "初心者向け完全ガイド",
          description: "チャンネルのテーマについて基礎から解説",
          format: "チュートリアル",
          estimatedLength: "15-20分",
          targetAudience: "新規視聴者",
          uniqueValue: "包括的な入門コンテンツ"
        }
      ],
      overallStrategy: "視聴者エンゲージメントを高めるコンテンツ戦略"
    };
  }

  async generateVideoIdeas(channelId) {
    try {
      const channelInfo = await this.youtubeApi.getChannelInfo(channelId);
      const videos = await this.youtubeApi.getChannelVideos(channelId, 20);
      const videoIds = videos.map(v => v.id.videoId);
      const videosWithStats = await this.youtubeApi.getVideoStatistics(videoIds);

      const prompt = this.formatPromptWithJSON(
        `以下のチャンネル情報を基に、具体的な動画アイデアを5つ生成してください：

チャンネル: ${channelInfo.snippet?.title}
登録者数: ${channelInfo.statistics?.subscriberCount}
総視聴回数: ${channelInfo.statistics?.viewCount}

最近の人気動画:
${videosWithStats.slice(0, 5).map(v => 
  `- ${v.snippet?.title} (${v.statistics?.viewCount}回視聴)`
).join('\n')}`,
        {
          ideas: [
            {
              title: "",
              concept: "",
              hookLine: "",
              contentOutline: [],
              thumbnailConcept: "",
              estimatedViews: ""
            }
          ]
        }
      );

      const response = await this.generateWithFallback(prompt);
      return this.extractJSON(response);
    } catch (error) {
      console.error('Video idea generation error:', error);
      throw new YouTubeAnalyzerError('動画アイデアの生成に失敗しました', 'VIDEO_IDEA_ERROR');
    }
  }

  async generateCustomVideoIdea(prompt, channelId = null, analysisData = null) {
    let contextInfo = '';
    
    if (channelId) {
      try {
        const channelInfo = await this.youtubeApi.getChannelInfo(channelId);
        contextInfo = `\nチャンネルコンテキスト:\n- ${channelInfo.snippet?.title}\n`;
      } catch (error) {
        console.warn('Failed to fetch channel context:', error);
      }
    }

    const fullPrompt = this.formatPromptWithJSON(
      `${contextInfo}${prompt}\n\n上記のリクエストに基づいて、YouTube動画のアイデアを生成してください。`,
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
      console.error('Custom idea generation error:', error);
      throw new YouTubeAnalyzerError('カスタムアイデアの生成に失敗しました', 'CUSTOM_IDEA_ERROR');
    }
  }

  async generateAIChannelVideoIdea(channelId, analysisData = null) {
    if (!analysisData) {
      const videos = await this.youtubeApi.getChannelVideos(channelId, 30);
      const videoIds = videos.map(v => v.id.videoId);
      const videosWithStats = await this.youtubeApi.getVideoStatistics(videoIds);
      
      analysisData = {
        topVideos: videosWithStats.sort((a, b) => 
          parseInt(b.statistics?.viewCount || 0) - parseInt(a.statistics?.viewCount || 0)
        ).slice(0, 10)
      };
    }

    const prompt = this.formatPromptWithJSON(
      `以下のチャンネルの成功パターンを分析し、AIを活用した革新的な動画アイデアを生成してください：

トップパフォーマンス動画:
${analysisData.topVideos.map(v => 
  `- ${v.snippet?.title} (${v.statistics?.viewCount}回視聴)`
).join('\n')}

AIツールやテクノロジーを活用して、視聴者に新しい価値を提供する動画アイデアを提案してください。`,
      {
        title: "",
        aiToolsUsed: [],
        innovativeAspects: [],
        implementationSteps: [],
        expectedImpact: "",
        technicalRequirements: []
      }
    );

    try {
      const response = await this.generateWithFallback(prompt);
      return this.extractJSON(response);
    } catch (error) {
      console.error('AI channel idea generation error:', error);
      throw new YouTubeAnalyzerError('AIチャンネルアイデアの生成に失敗しました', 'AI_IDEA_ERROR');
    }
  }
}