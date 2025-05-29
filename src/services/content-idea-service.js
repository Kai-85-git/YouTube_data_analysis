import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config.js';

export class ContentIdeaService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
  }

  async analyzeFromCommentData(commentAnalysisData, channelVideos) {
    try {
      const { topComments, constructiveComments, improvementComments, statistics } = commentAnalysisData;
      
      const prompt = `
YouTubeチャンネルのコメント分析結果と動画データを基に、具体的で実行可能な次の動画アイデアを提案してください。

【コメント分析結果】
人気コメント（いいね数順）:
${topComments.map(comment => `・${comment.text} (👍${comment.likeCount})`).join('\n')}

建設的なコメント:
${constructiveComments.map(comment => `・${comment.text} (👍${comment.likeCount})`).join('\n')}

改善提案コメント:
${improvementComments.map(comment => `・${comment.text} (👍${comment.likeCount})`).join('\n')}

【コメント統計】
- 総コメント数: ${statistics.totalComments}
- 平均いいね数: ${statistics.averageLikes}
- 最高いいね数: ${statistics.maxLikes}

【チャンネル動画データ】
${channelVideos.map(video => `
タイトル: ${video.title}
再生回数: ${video.viewCount?.toLocaleString() || 'N/A'}
いいね数: ${video.likeCount?.toLocaleString() || 'N/A'}
コメント数: ${video.commentCount?.toLocaleString() || 'N/A'}
公開日: ${video.publishedAt}
`).join('\n')}

コメントパターンを詳細に分析し、視聴者が実際に求めている具体的な動画アイデアを提案してください。

以下の形式でJSON回答してください：
{
  "analysis": {
    "viewerInsights": [
      {
        "insight": "視聴者の洞察",
        "evidence": "根拠となるコメント例",
        "priority": "優先度（高/中/低）"
      }
    ],
    "contentGaps": ["不足しているコンテンツ1", "不足しているコンテンツ2"],
    "trendingTopics": ["注目トピック1", "注目トピック2"]
  },
  "quickIdeas": [
    {
      "title": "具体的な動画タイトル",
      "reason": "提案理由（コメントの根拠を含む）",
      "estimatedViews": "予想視聴数倍率（例: 1.5倍）",
      "productionTime": "制作時間目安",
      "difficulty": "制作難易度（易/中/難）",
      "tags": ["タグ1", "タグ2", "タグ3"],
      "targetAudience": "ターゲット視聴者",
      "keyPoints": ["要点1", "要点2", "要点3"]
    }
  ],
  "seriesIdeas": [
    {
      "seriesTitle": "シリーズタイトル",
      "episodeCount": 話数,
      "schedule": "更新スケジュール",
      "description": "シリーズ説明",
      "episodes": [
        {
          "title": "第1話タイトル",
          "description": "内容説明"
        }
      ],
      "expectedEngagement": "期待されるエンゲージメント効果"
    }
  ],
  "optimizationTips": {
    "bestUploadTime": "最適投稿時間",
    "titleFormats": ["効果的なタイトル形式1", "形式2"],
    "thumbnailSuggestions": ["サムネイル提案1", "提案2"],
    "videoLength": "推奨動画時間"
  }
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('コメント分析からのアイデア生成エラー:', error);
      return this.getFallbackAnalysisFromComments();
    }
  }

  async analyzePopularPatterns(topVideos) {
    try {
      const prompt = `
人気動画のパターンを分析して、成功要因を抽出してください。

【人気動画データ】
${topVideos.map(video => `
タイトル: ${video.title}
視聴回数: ${video.viewCount}
いいね率: ${((video.likeCount / video.viewCount) * 100).toFixed(2)}%
投稿日: ${video.publishedAt}
時間: ${video.duration}
`).join('\n')}

以下の形式でJSON回答してください：
{
  "patterns": [
    {
      "pattern": "パターン名",
      "description": "説明",
      "successFactor": "成功要因",
      "examples": ["例1", "例2"]
    }
  ],
  "optimalTiming": {
    "dayOfWeek": "最適曜日",
    "timeOfDay": "最適時間帯"
  },
  "titleFormats": ["効果的なタイトル形式1", "形式2"],
  "videoLength": "最適動画時間"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('人気パターン分析エラー:', error);
      return this.getFallbackPatterns();
    }
  }

  async generateVideoIdeas(viewerNeeds, patterns, channelTheme = 'プログラミング・技術') {
    try {
      const prompt = `
視聴者ニーズと人気パターンを基に、具体的な動画アイデアを提案してください。

【視聴者ニーズ】
${JSON.stringify(viewerNeeds, null, 2)}

【成功パターン】
${JSON.stringify(patterns, null, 2)}

【チャンネルテーマ】
${channelTheme}

以下の形式でJSON回答してください：
{
  "quickIdeas": [
    {
      "title": "動画タイトル",
      "reason": "提案理由",
      "estimatedViews": "予想視聴数倍率",
      "productionTime": "制作時間目安",
      "difficulty": "制作難易度（易/中/難）",
      "tags": ["タグ1", "タグ2"]
    }
  ],
  "seriesIdeas": [
    {
      "seriesTitle": "シリーズタイトル",
      "episodeCount": 話数,
      "schedule": "更新スケジュール",
      "description": "シリーズ説明",
      "episodes": ["第1話タイトル", "第2話タイトル"]
    }
  ],
  "trendingIdeas": [
    {
      "title": "トレンド動画タイトル",
      "urgency": "緊急度（高/中/低）",
      "reason": "トレンド理由"
    }
  ]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('動画アイデア生成エラー:', error);
      return this.getFallbackIdeas();
    }
  }

  getFallbackViewerNeeds() {
    return {
      viewerNeeds: [
        {
          topic: "React基礎",
          demand: "高",
          reasoning: "コメントで多数の質問",
          commentCount: 15
        }
      ],
      trendingKeywords: ["React", "Next.js", "TypeScript"],
      contentGaps: ["実践的なチュートリアル", "エラー解決方法"]
    };
  }

  getFallbackPatterns() {
    return {
      patterns: [
        {
          pattern: "問題解決型",
          description: "よくある問題とその解決方法",
          successFactor: "実用性の高さ",
          examples: ["エラー解決", "パフォーマンス改善"]
        }
      ],
      optimalTiming: {
        dayOfWeek: "金曜日",
        timeOfDay: "19:00-21:00"
      },
      titleFormats: ["【解決】○○の問題", "5分で分かる○○"],
      videoLength: "10-15分"
    };
  }

  getFallbackAnalysisFromComments() {
    return {
      analysis: {
        viewerInsights: [
          {
            insight: "初心者向けの解説を求める声が多い",
            evidence: "「わからない」「教えて」というコメントが多数",
            priority: "高"
          }
        ],
        contentGaps: ["基礎解説動画", "実践的なチュートリアル"],
        trendingTopics: ["React", "JavaScript", "初心者向け"]
      },
      quickIdeas: [
        {
          title: "視聴者からの質問に答える Q&A動画",
          reason: "コメントで多数の質問が寄せられている",
          estimatedViews: "1.3倍",
          productionTime: "2-3時間",
          difficulty: "易",
          tags: ["Q&A", "視聴者参加", "質問回答"],
          targetAudience: "既存の視聴者",
          keyPoints: ["視聴者エンゲージメント向上", "コミュニティ形成", "簡単制作"]
        }
      ],
      seriesIdeas: [
        {
          seriesTitle: "視聴者リクエスト企画",
          episodeCount: 4,
          schedule: "隔週更新",
          description: "視聴者からのリクエストに応える企画シリーズ",
          episodes: [
            {
              title: "第1話: 人気リクエストTOP3",
              description: "最も要望の多かった3つのトピックを解説"
            }
          ],
          expectedEngagement: "視聴者との距離が縮まり、コメント数増加が期待"
        }
      ],
      optimizationTips: {
        bestUploadTime: "分析データ不足のため要検証",
        titleFormats: ["【解説】〇〇について", "視聴者質問：〇〇の方法"],
        thumbnailSuggestions: ["Q&Aマーク", "視聴者の顔写真"],
        videoLength: "10-15分（集中力を保てる長さ）"
      }
    };
  }

  getFallbackIdeas() {
    return {
      quickIdeas: [
        {
          title: "React useState の落とし穴 TOP5",
          reason: "コメントで質問多数",
          estimatedViews: "1.5倍",
          productionTime: "2-4時間",
          difficulty: "易",
          tags: ["React", "初心者", "よくある間違い"]
        }
      ],
      seriesIdeas: [
        {
          seriesTitle: "ゼロから作るTodoアプリ",
          episodeCount: 5,
          schedule: "毎週金曜更新",
          description: "React + Node.jsでフルスタック開発",
          episodes: ["環境構築編", "フロントエンド編"]
        }
      ],
      trendingIdeas: [
        {
          title: "Next.js 14 新機能まとめ",
          urgency: "高",
          reason: "最新リリース対応"
        }
      ]
    };
  }
}