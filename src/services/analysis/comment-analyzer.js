import { BaseGeminiService } from '../base/gemini-service.js';
import { YouTubeAnalyzerError } from '../../utils/errors.js';

class KeywordCommentAnalyzer {
  constructor() {
    this.positiveKeywords = ['良い', 'いい', '素晴らしい', 'すばらしい', '最高', 'ありがとう', '助かる', '面白い', 'おもしろい', '参考になる'];
    this.negativeKeywords = ['悪い', 'ダメ', 'つまらない', '分かりにくい', 'わかりにくい', '微妙', '改善'];
    this.questionKeywords = ['？', '?', 'どう', 'なぜ', '教えて'];
  }

  async analyze(comments) {
    const analysis = {
      totalComments: comments.length,
      positiveComments: 0,
      negativeComments: 0,
      neutralComments: 0,
      questions: 0,
      averageLength: 0,
      topKeywords: {},
      sentiment: {
        positive: [],
        negative: [],
        questions: []
      }
    };

    let totalLength = 0;
    const keywordCount = {};

    for (const comment of comments) {
      const text = comment.snippet?.topLevelComment?.snippet?.textDisplay || comment.snippet?.textDisplay || '';
      totalLength += text.length;

      const words = text.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          keywordCount[word] = (keywordCount[word] || 0) + 1;
        }
      });

      const hasPositive = this.positiveKeywords.some(keyword => text.includes(keyword));
      const hasNegative = this.negativeKeywords.some(keyword => text.includes(keyword));
      const hasQuestion = this.questionKeywords.some(keyword => text.includes(keyword));

      if (hasPositive) {
        analysis.positiveComments++;
        if (analysis.sentiment.positive.length < 5) {
          analysis.sentiment.positive.push(text.substring(0, 100));
        }
      } else if (hasNegative) {
        analysis.negativeComments++;
        if (analysis.sentiment.negative.length < 5) {
          analysis.sentiment.negative.push(text.substring(0, 100));
        }
      } else {
        analysis.neutralComments++;
      }

      if (hasQuestion) {
        analysis.questions++;
        if (analysis.sentiment.questions.length < 5) {
          analysis.sentiment.questions.push(text.substring(0, 100));
        }
      }
    }

    analysis.averageLength = Math.round(totalLength / comments.length);
    analysis.topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [word, count]) => {
        acc[word] = count;
        return acc;
      }, {});

    return analysis;
  }
}

class AICommentAnalyzer extends BaseGeminiService {
  async analyze(comments, videoTitle = '') {
    const commentTexts = comments.map(comment => 
      comment.snippet?.topLevelComment?.snippet?.textDisplay || 
      comment.snippet?.textDisplay || ''
    ).filter(text => text.length > 0);

    const prompt = this.formatPromptWithJSON(
      `以下の動画「${videoTitle}」のコメントを分析してください。
      
コメント一覧:
${commentTexts.slice(0, 50).join('\n')}

以下の観点で分析してください:
1. 全体的なセンチメント（肯定的/否定的/中立の割合）
2. 主なトピックやテーマ（最大5つ）
3. 視聴者からの主な要望や質問
4. 改善すべき点
5. 視聴者が特に評価している点`,
      {
        sentiment: {
          positive: 0,
          negative: 0,
          neutral: 0,
          summary: ""
        },
        mainTopics: [],
        viewerRequests: [],
        improvements: [],
        strengths: [],
        overallInsight: ""
      }
    );

    try {
      const response = await this.generateWithFallback(prompt);
      return this.extractJSON(response);
    } catch (error) {
      console.error('AI comment analysis failed:', error);
      throw new Error('コメント分析に失敗しました');
    }
  }
}

export class CommentAnalysisService {
  constructor(options = {}) {
    this.strategy = options.strategy || 'ai';
    this.aiAnalyzer = new AICommentAnalyzer();
    this.keywordAnalyzer = new KeywordCommentAnalyzer();
  }

  async analyzeComments(comments, options = {}) {
    const { videoTitle, forceStrategy } = options;
    const useAI = forceStrategy || this.strategy === 'ai';

    try {
      if (useAI) {
        return await this.aiAnalyzer.analyze(comments, videoTitle);
      }
      return await this.keywordAnalyzer.analyze(comments);
    } catch (error) {
      if (useAI && !forceStrategy) {
        console.warn('AI analysis failed, falling back to keyword analysis:', error);
        return await this.keywordAnalyzer.analyze(comments);
      }
      throw error;
    }
  }

  async analyzeChannelComments(channelId) {
    const { YouTubeApiService } = await import('../youtube-api.js');
    const apiService = new YouTubeApiService();
    
    try {
      const recentVideos = await apiService.getChannelVideos(channelId, 10);
      
      if (!recentVideos || recentVideos.length === 0) {
        throw new YouTubeAnalyzerError('動画が見つかりませんでした', 'NO_VIDEOS_FOUND');
      }

      const allComments = [];
      const videoAnalyses = [];

      for (const video of recentVideos) {
        try {
          const comments = await apiService.getVideoComments(video.id.videoId, 50);
          if (comments && comments.length > 0) {
            allComments.push(...comments);
            
            const analysis = await this.analyzeComments(comments, {
              videoTitle: video.snippet.title,
              forceStrategy: 'keyword'
            });
            
            videoAnalyses.push({
              videoId: video.id.videoId,
              videoTitle: video.snippet.title,
              analysis
            });
          }
        } catch (error) {
          console.warn(`Failed to analyze comments for video ${video.id.videoId}:`, error);
        }
      }

      const overallAnalysis = await this.analyzeComments(allComments, {
        videoTitle: 'チャンネル全体',
        forceStrategy: this.strategy
      });

      return {
        channelId,
        totalVideosAnalyzed: videoAnalyses.length,
        totalComments: allComments.length,
        overallAnalysis,
        videoAnalyses: videoAnalyses.slice(0, 5)
      };
    } catch (error) {
      console.error('Channel comment analysis error:', error);
      throw new YouTubeAnalyzerError(
        error.message || 'コメント分析中にエラーが発生しました',
        error.code || 'COMMENT_ANALYSIS_ERROR'
      );
    }
  }
}