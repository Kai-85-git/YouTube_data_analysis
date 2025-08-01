import { GoogleGenerativeAI } from '@google/generative-ai';
import { YouTubeApiService } from './youtube-api.js';
import { config } from '../config/config.js';
import { YouTubeAnalyzerError } from '../utils/errors.js';

export class VideoAnalysisService {
  constructor(youtubeApiKey, geminiApiKey) {
    this.youtubeApi = new YouTubeApiService(youtubeApiKey || config.youtube.apiKey);
    this.genAI = new GoogleGenerativeAI(geminiApiKey || config.gemini.apiKey);
    
    // 利用可能なモデル名をフォールバック順で定義
    this.availableModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-001', 
      'gemini-1.5-pro',
      'gemini-1.5-pro-001',
      'gemini-2.0-flash-exp'
    ];
    
    this.initializeModel();
  }

  initializeModel() {
    const modelName = this.availableModels[0]; // 最初のモデルを使用
    console.log(`Geminiモデルを初期化中: ${modelName}`);
    
    this.model = this.genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      }
    });
  }

  async generateWithFallback(prompt, modelIndex = 0) {
    if (modelIndex >= this.availableModels.length) {
      throw new Error('すべてのモデルで生成に失敗しました');
    }

    const modelName = this.availableModels[modelIndex];
    console.log(`モデル ${modelName} で生成中...`);

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn(`モデル ${modelName} でエラー:`, error.message);
      if (error.message.includes('not found') || error.message.includes('404')) {
        // 次のモデルを試行
        return this.generateWithFallback(prompt, modelIndex + 1);
      }
      throw error;
    }
  }

  async analyzeChannelVideos(channelId, maxVideos = 20) {
    try {
      // 1. チャンネルの動画データを取得
      const uploadsPlaylistId = await this.youtubeApi.getUploadsPlaylist(channelId);
      const playlistVideos = await this.youtubeApi.getPlaylistVideos(uploadsPlaylistId, maxVideos);
      
      const videoIds = playlistVideos
        .map(item => item.snippet.resourceId.videoId)
        .filter(id => id);

      if (videoIds.length === 0) {
        throw new YouTubeAnalyzerError('動画データが見つかりません');
      }

      // 2. 動画の統計情報を取得
      const videoStats = await this.youtubeApi.getVideoStatistics(videoIds);
      
      // 3. 一部の動画のコメントも取得（分析の質を向上）
      const topVideoIds = videoIds.slice(0, 5); // 最新5本の動画
      const commentsData = await this.getVideoComments(topVideoIds);

      // 4. データを整理
      const analyzedVideos = this.formatVideoData(playlistVideos, videoStats, commentsData);
      
      // 5. Geminiで分析
      const analysisResult = await this.performAIAnalysis(analyzedVideos);
      
      // 6. 動画アイデアも生成
      const videoIdeasResult = await this.generateVideoIdeasFromAnalysis(analyzedVideos);
      
      return {
        videosAnalyzed: analyzedVideos.length,
        performanceMetrics: this.calculatePerformanceMetrics(analyzedVideos),
        aiAnalysis: analysisResult,
        videoIdeas: videoIdeasResult,
        videoData: analyzedVideos
      };

    } catch (error) {
      throw new YouTubeAnalyzerError(`動画分析に失敗しました: ${error.message}`, error.code);
    }
  }

  async getVideoComments(videoIds) {
    const commentsData = {};
    
    for (const videoId of videoIds) {
      try {
        const comments = await this.youtubeApi.getVideoComments(videoId, 50);
        commentsData[videoId] = comments.map(comment => ({
          text: comment.snippet.topLevelComment.snippet.textDisplay,
          likeCount: comment.snippet.topLevelComment.snippet.likeCount,
          publishedAt: comment.snippet.topLevelComment.snippet.publishedAt
        }));
      } catch (error) {
        console.warn(`コメント取得失敗 (${videoId}):`, error.message);
        commentsData[videoId] = [];
      }
    }
    
    return commentsData;
  }

  formatVideoData(playlistVideos, videoStats, commentsData) {
    return playlistVideos.map(video => {
      const videoId = video.snippet.resourceId.videoId;
      const stats = videoStats.find(stat => stat.id === videoId);
      const comments = commentsData[videoId] || [];
      
      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails,
        statistics: stats ? {
          viewCount: parseInt(stats.statistics.viewCount || 0),
          likeCount: parseInt(stats.statistics.likeCount || 0),
          commentCount: parseInt(stats.statistics.commentCount || 0),
          duration: stats.contentDetails.duration
        } : null,
        topComments: comments.slice(0, 10), // 上位10コメント
        engagementRate: stats ? this.calculateEngagementRate(stats.statistics) : 0
      };
    }).filter(video => video.statistics);
  }

  calculateEngagementRate(stats) {
    const views = parseInt(stats.viewCount || 0);
    const likes = parseInt(stats.likeCount || 0);
    const comments = parseInt(stats.commentCount || 0);
    
    if (views === 0) return 0;
    return ((likes + comments) / views * 100).toFixed(2);
  }

  calculatePerformanceMetrics(videos) {
    if (videos.length === 0) return null;

    const viewCounts = videos.map(v => v.statistics.viewCount);
    const likeCounts = videos.map(v => v.statistics.likeCount);
    const commentCounts = videos.map(v => v.statistics.commentCount);
    const engagementRates = videos.map(v => parseFloat(v.engagementRate));

    return {
      totalVideos: videos.length,
      averageViews: Math.round(viewCounts.reduce((a, b) => a + b, 0) / videos.length),
      averageLikes: Math.round(likeCounts.reduce((a, b) => a + b, 0) / videos.length),
      averageComments: Math.round(commentCounts.reduce((a, b) => a + b, 0) / videos.length),
      averageEngagementRate: (engagementRates.reduce((a, b) => a + b, 0) / videos.length).toFixed(2),
      topPerformingVideo: videos.reduce((prev, current) => 
        (prev.statistics.viewCount > current.statistics.viewCount) ? prev : current
      ),
      uploadPattern: this.analyzeUploadPattern(videos)
    };
  }

  analyzeUploadPattern(videos) {
    const uploads = videos.map(v => new Date(v.publishedAt));
    const dayOfWeek = uploads.map(date => date.getDay());
    const hourOfDay = uploads.map(date => date.getHours());

    const dayCount = dayOfWeek.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const hourCount = hourOfDay.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const dayNames = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const mostPopularDay = dayNames[Object.keys(dayCount).reduce((a, b) => dayCount[a] > dayCount[b] ? a : b)];
    const mostPopularHour = Object.keys(hourCount).reduce((a, b) => hourCount[a] > hourCount[b] ? a : b);

    return {
      mostPopularDay,
      mostPopularHour: `${mostPopularHour}時`,
      dayDistribution: dayCount,
      hourDistribution: hourCount
    };
  }

  async performAIAnalysis(videos) {
    try {
      console.log('Gemini分析開始...');
      const analysisPrompt = this.createAnalysisPrompt(videos);
      console.log('分析プロンプト生成完了');
      
      const analysisText = await this.generateWithFallback(analysisPrompt);
      console.log('Gemini分析完了:', analysisText.length, '文字');
      
      return {
        analysis: analysisText,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini分析エラー:', error);
      return {
        analysis: `AI分析が利用できませんでした。エラー: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  createAnalysisPrompt(videos) {
    const performanceData = this.calculatePerformanceMetrics(videos);
    const topVideos = videos
      .sort((a, b) => b.statistics.viewCount - a.statistics.viewCount)
      .slice(0, 5);

    const topComments = videos
      .filter(v => v.topComments.length > 0)
      .flatMap(v => v.topComments.slice(0, 3))
      .slice(0, 15);

    return `
YouTubeチャンネルの動画分析を行い、次の動画投稿の戦略提案をしてください。

## 分析データ:

### パフォーマンス指標:
- 分析動画数: ${performanceData.totalVideos}本
- 平均再生回数: ${performanceData.averageViews.toLocaleString()}回
- 平均いいね数: ${performanceData.averageLikes.toLocaleString()}件
- 平均コメント数: ${performanceData.averageComments.toLocaleString()}件
- 平均エンゲージメント率: ${performanceData.averageEngagementRate}%

### トップパフォーマンス動画:
${topVideos.map((video, index) => `${index + 1}. "${video.title}" - ${video.statistics.viewCount.toLocaleString()}回再生`).join('\n')}

### 投稿パターン:
- 最も投稿が多い曜日: ${performanceData.uploadPattern.mostPopularDay}
- 最も投稿が多い時間: ${performanceData.uploadPattern.mostPopularHour}

### 代表的なコメント:
${topComments.map(comment => `"${comment.text.substring(0, 100)}..."`).join('\n')}

## 分析要求:
1. **傾向分析**: 高パフォーマンス動画の共通点を分析
2. **コンテンツ戦略**: 視聴者の反応が良いテーマやフォーマットの特定
3. **投稿最適化**: より良い投稿タイミングの提案
4. **次回動画提案**: 具体的な動画アイデア3-5個を提案
5. **改善点**: エンゲージメント向上のための具体的アドバイス

分析は日本語で、実用的で具体的な提案を含めてください。各提案には理由も明記してください。
`;
  }

  async generateVideoIdeasFromAnalysis(videos) {
    try {
      console.log('動画アイデア生成開始...');
      const performanceData = this.calculatePerformanceMetrics(videos);
      const topVideos = videos
        .sort((a, b) => b.statistics.viewCount - a.statistics.viewCount)
        .slice(0, 10);

      const ideaPrompt = `
以下のYouTubeチャンネル分析データを基に、新しい動画アイデアを5個提案してください：

## パフォーマンス指標:
- 分析動画数: ${performanceData.totalVideos}本
- 平均再生回数: ${performanceData.averageViews.toLocaleString()}回
- 平均いいね数: ${performanceData.averageLikes.toLocaleString()}件
- 平均エンゲージメント率: ${performanceData.averageEngagementRate}%
- 人気投稿曜日: ${performanceData.uploadPattern.mostPopularDay}
- 人気投稿時間: ${performanceData.uploadPattern.mostPopularHour}

## トップパフォーマンス動画:
${topVideos.map((video, index) => `${index + 1}. "${video.title}" - ${video.statistics.viewCount.toLocaleString()}回再生`).join('\n')}

## 要求:
各動画アイデアは以下の形式で提案してください：

**動画アイデア 1:**
- タイトル: [魅力的なタイトル]
- 内容概要: [具体的な動画内容]
- 期待効果: [成功理由]
- 推奨投稿時期: [最適なタイミング]

このような形式で5個のアイデアを提案してください。回答は日本語で、実現可能で具体的な提案をしてください。
`;

      const ideasText = await this.generateWithFallback(ideaPrompt);
      console.log('動画アイデア生成完了:', ideasText.length, '文字');
      
      return {
        ideas: ideasText,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('動画アイデア生成エラー:', error);
      return {
        ideas: `動画アイデアの生成に失敗しました。エラー: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateVideoIdeas(channelId, specificTopic = null) {
    try {
      const analysisResult = await this.analyzeChannelVideos(channelId, 30);
      
      const ideaPrompt = `
以下のYouTubeチャンネル分析データを基に、新しい動画アイデアを5個提案してください：

## チャンネル分析結果:
${JSON.stringify(analysisResult.performanceMetrics, null, 2)}

## トップパフォーマンス動画タイトル:
${analysisResult.videoData
  .sort((a, b) => b.statistics.viewCount - a.statistics.viewCount)
  .slice(0, 10)
  .map((video, index) => `${index + 1}. ${video.title}`)
  .join('\n')
}

${specificTopic ? `## 特定のトピック要求: ${specificTopic}` : ''}

## 要求:
1. チャンネルの成功パターンを分析
2. 視聴者のニーズに基づいた動画アイデアを5個提案
3. 各アイデアに期待される効果を説明
4. 最適な投稿タイミングも提案

各動画アイデアは以下の形式で提案してください：
- タイトル: [魅力的なタイトル]
- 内容概要: [動画の内容説明]
- 期待効果: [なぜこの動画が成功すると予想されるか]
- 推奨投稿時期: [最適な投稿曜日・時間]

回答は日本語で、実現可能で具体的な提案をしてください。
`;

      const result = await this.model.generateContent(ideaPrompt);
      const response = await result.response;
      
      return {
        ideas: response.text(),
        basedOnAnalysis: analysisResult.performanceMetrics,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new YouTubeAnalyzerError(`動画アイデア生成に失敗しました: ${error.message}`, error.code);
    }
  }

  async generateCustomVideoIdea(prompt, channelId, analysisData) {
    try {
      const ideaPrompt = `
あなたはYouTubeチャンネルのコンサルタントです。
以下の情報を基に、ユーザーが作りたい動画のアイデアを具体化してください。

## ユーザーのリクエスト:
${prompt}

## チャンネル分析データ:
${analysisData ? JSON.stringify(analysisData, null, 2) : 'データなし'}

## 要求:
以下のJSON形式で回答してください：
{
  "title": "視聴者の興味を引く魅力的なタイトル（日本語で50文字以内）",
  "concept": "動画のメインコンセプト（100文字程度）",
  "reasoning": "なぜこの動画がおすすめか（チャンネルの特性を踏まえた理由）",
  "expectedPerformance": [
    "期待される成果1",
    "期待される成果2",
    "期待される成果3"
  ],
  "structure": [
    "イントロ（最初の30秒）",
    "メインコンテンツ1",
    "メインコンテンツ2",
    "まとめ・CTA"
  ],
  "successTips": [
    "成功のポイント1",
    "成功のポイント2",
    "成功のポイント3"
  ],
  "recommendedLength": "推奨動画時間（例：10-15分）",
  "optimalPublishTime": "最適な投稿時間（例：金曜日 20:00）"
}

必ず上記のJSON形式で回答してください。
`;

      const result = await this.generateWithFallback(ideaPrompt);
      const response = await result.response;
      const responseText = response.text();
      
      try {
        // JSONとして解析を試みる
        const cleanedText = responseText.replace(/```json\s*|\s*```/g, '').trim();
        const parsedIdea = JSON.parse(cleanedText);
        
        return parsedIdea;
      } catch (parseError) {
        // JSON解析に失敗した場合、デフォルトの構造で返す
        console.error('JSON parse error:', parseError);
        return {
          title: "動画タイトルの生成に失敗しました",
          concept: responseText.substring(0, 100),
          reasoning: "AIレスポンスの解析に失敗しました",
          expectedPerformance: ["詳細な分析結果を取得できませんでした"],
          structure: ["構成案を生成できませんでした"],
          successTips: ["成功のポイントを生成できませんでした"],
          recommendedLength: "10-15分",
          optimalPublishTime: "金曜日 20:00"
        };
      }
      
    } catch (error) {
      console.error('Custom video idea generation error:', error);
      throw new YouTubeAnalyzerError(`カスタム動画アイデア生成に失敗しました: ${error.message}`, error.code);
    }
  }
}