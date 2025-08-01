import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config.js';

export class ContentIdeaService {
  constructor(youtubeApiKey, geminiApiKey) {
    const apiKey = geminiApiKey || config.gemini.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
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

  async generateCustomVideoIdea(userPrompt, channelContext = null) {
    try {
      const systemPrompt = `あなたはYouTubeの動画企画の専門家です。
ユーザーのリクエストに基づいて、具体的で実践的な動画アイデアを生成してください。

必ず以下のJSON形式で回答してください：
{
  "title": "動画のタイトル（魅力的で具体的に）",
  "concept": "動画のコンセプト（100文字程度で説明）",
  "targetAudience": "ターゲット視聴者層",
  "structure": [
    "1. イントロ部分の内容",
    "2. メインコンテンツ1",
    "3. メインコンテンツ2",
    "4. まとめ部分"
  ],
  "keyPoints": [
    "成功のポイント1",
    "成功のポイント2",
    "成功のポイント3"
  ],
  "estimatedTime": "制作時間の目安",
  "difficulty": "難易度（易/中/難）",
  "estimatedViews": "予想視聴数（例：現在の平均×1.5）",
  "tags": ["タグ1", "タグ2", "タグ3"]
}`;

      let contextInfo = "";
      if (channelContext) {
        contextInfo = `
チャンネル情報:
- 現在の視聴者ニーズ: ${JSON.stringify(channelContext.viewerNeeds || {})}
- 成功パターン: ${JSON.stringify(channelContext.patterns || {})}
`;
      }

      const prompt = `${systemPrompt}

${contextInfo}

ユーザーのリクエスト: ${userPrompt}

上記のリクエストに基づいて、具体的で実践的な動画アイデアを生成してください。`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSONを抽出してパース
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI応答からJSONを抽出できませんでした');
      }

      const customIdea = JSON.parse(jsonMatch[0]);
      
      // デフォルト値の設定
      return {
        title: customIdea.title || "カスタム動画アイデア",
        concept: customIdea.concept || "ユーザーリクエストに基づく動画",
        targetAudience: customIdea.targetAudience || "一般視聴者",
        structure: customIdea.structure || ["イントロ", "メインコンテンツ", "まとめ"],
        keyPoints: customIdea.keyPoints || ["ポイント1", "ポイント2", "ポイント3"],
        estimatedTime: customIdea.estimatedTime || "2-4時間",
        difficulty: customIdea.difficulty || "中",
        estimatedViews: customIdea.estimatedViews || "現在の平均×1.2",
        tags: customIdea.tags || ["動画", "YouTube"]
      };

    } catch (error) {
      console.error('カスタム動画アイデア生成エラー:', error);
      
      // フォールバック
      return {
        title: `${userPrompt}に関する動画`,
        concept: "ユーザーのリクエストに基づいた動画企画",
        targetAudience: "興味のある視聴者",
        structure: [
          "1. 導入・概要説明",
          "2. メインコンテンツの詳細解説",
          "3. 実例・デモンストレーション",
          "4. まとめと次回予告"
        ],
        keyPoints: [
          "視聴者のニーズに応える内容にする",
          "わかりやすい説明を心がける",
          "実践的な情報を提供する"
        ],
        estimatedTime: "3-5時間",
        difficulty: "中",
        estimatedViews: "現在の平均×1.3",
        tags: ["カスタム", "リクエスト", "動画企画"]
      };
    }
  }

  async generateAIChannelVideoIdea(userPrompt, channelId, analysisData = null) {
    try {
      // チャンネルの詳細情報を含む高度なプロンプト
      const systemPrompt = `あなたはYouTubeチャンネルの成長戦略専門家です。
チャンネルの分析データを基に、ユーザーのリクエストに最適な動画アイデアを提案してください。

必ず以下のJSON形式で回答してください：
{
  "title": "具体的で魅力的な動画タイトル",
  "concept": "動画のコンセプト（チャンネルの特性を考慮した100文字程度の説明）",
  "reasoning": "なぜこの動画がこのチャンネルに適しているかの理由",
  "expectedPerformance": [
    "期待される成果1（具体的な数値や効果）",
    "期待される成果2",
    "期待される成果3"
  ],
  "structure": [
    "1. オープニング（0:00-0:30）: 内容",
    "2. メインコンテンツ1（0:30-5:00）: 内容",
    "3. メインコンテンツ2（5:00-10:00）: 内容",
    "4. まとめ（10:00-12:00）: 内容"
  ],
  "successTips": [
    "このチャンネルの視聴者に響くポイント1",
    "成功のための具体的なアドバイス2",
    "チャンネルの強みを活かす方法3"
  ],
  "recommendedLength": "推奨動画時間（例：10-15分）",
  "bestUploadTime": "最適な投稿タイミング（曜日・時間帯）",
  "thumbnailSuggestion": "効果的なサムネイルの提案",
  "suggestedTags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"]
}`;

      let channelAnalysisInfo = "";
      if (analysisData) {
        channelAnalysisInfo = `
チャンネル分析データ:
- 平均再生回数: ${analysisData.performanceMetrics?.averageViews || '不明'}
- 平均いいね数: ${analysisData.performanceMetrics?.averageLikes || '不明'}
- エンゲージメント率: ${analysisData.performanceMetrics?.averageEngagementRate || '不明'}%
- 人気投稿曜日: ${analysisData.performanceMetrics?.uploadPattern?.mostPopularDay || '不明'}
- 人気投稿時間: ${analysisData.performanceMetrics?.uploadPattern?.mostPopularHour || '不明'}
- トップ動画: ${analysisData.performanceMetrics?.topPerformingVideo?.title || '不明'}
- AI分析結果: ${analysisData.aiAnalysis?.analysis ? '利用可能' : '利用不可'}
`;
      }

      const prompt = `${systemPrompt}

${channelAnalysisInfo}

ユーザーのリクエスト: ${userPrompt}

チャンネルの分析データを考慮し、このチャンネルの視聴者層と過去の成功パターンに合わせた、具体的で実践的な動画アイデアを生成してください。`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSONを抽出してパース（コードブロックも考慮）
      let aiIdea;
      try {
        // まず、コードブロックを除去
        const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
        
        // 最初の{から最後の}までを抽出（ネストされたJSONに対応）
        let braceCount = 0;
        let startIdx = -1;
        let endIdx = -1;
        
        for (let i = 0; i < cleanedText.length; i++) {
          if (cleanedText[i] === '{') {
            if (startIdx === -1) startIdx = i;
            braceCount++;
          } else if (cleanedText[i] === '}') {
            braceCount--;
            if (braceCount === 0 && startIdx !== -1) {
              endIdx = i + 1;
              break;
            }
          }
        }
        
        if (startIdx === -1 || endIdx === -1) {
          throw new Error('有効なJSONが見つかりませんでした');
        }
        
        const jsonStr = cleanedText.substring(startIdx, endIdx);
        aiIdea = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON解析エラー:', parseError);
        console.error('AI応答テキスト:', text);
        throw new Error(`AI応答の解析に失敗しました: ${parseError.message}`);
      }
      
      // デフォルト値の設定と検証
      return {
        title: aiIdea.title || "チャンネル最適化動画アイデア",
        concept: aiIdea.concept || "チャンネル分析に基づく動画企画",
        reasoning: aiIdea.reasoning || "このチャンネルの視聴者に適した内容です",
        expectedPerformance: aiIdea.expectedPerformance || [
          "視聴者エンゲージメントの向上",
          "新規視聴者の獲得",
          "既存視聴者の満足度向上"
        ],
        structure: aiIdea.structure || [
          "1. イントロダクション",
          "2. メインコンテンツ",
          "3. 実例・デモ",
          "4. まとめと次回予告"
        ],
        successTips: aiIdea.successTips || [
          "視聴者のニーズに応える",
          "チャンネルの特色を活かす",
          "エンゲージメントを促す"
        ],
        recommendedLength: aiIdea.recommendedLength || "10-15分",
        bestUploadTime: aiIdea.bestUploadTime || analysisData?.performanceMetrics?.uploadPattern?.mostPopularDay || "金曜日 19:00",
        thumbnailSuggestion: aiIdea.thumbnailSuggestion || "目を引くビジュアルとテキスト",
        suggestedTags: aiIdea.suggestedTags || ["動画", "YouTube", userPrompt.split(' ')[0]]
      };

    } catch (error) {
      console.error('AIチャンネル動画アイデア生成エラー:', error);
      
      // エラーの種類に応じたフォールバック
      if (error.message.includes('AI応答の解析に失敗')) {
        // JSON解析エラーの場合は、シンプルなフォーマットで再試行
        try {
          const simplePrompt = `
${userPrompt}についての動画アイデアを提案してください。
以下の項目について、簡潔に答えてください：
1. タイトル
2. 内容の概要
3. なぜおすすめか
4. 期待される効果
5. 動画の構成
`;
          const fallbackResult = await this.model.generateContent(simplePrompt);
          const fallbackResponse = await fallbackResult.response;
          const fallbackText = fallbackResponse.text();
          
          // テキストから情報を抽出
          return {
            title: `${userPrompt}についての動画企画`,
            concept: fallbackText.substring(0, 200),
            reasoning: "視聴者のニーズに応える内容です",
            expectedPerformance: [
              "視聴者の関心を引く内容",
              "エンゲージメントの向上",
              "新規視聴者の獲得"
            ],
            structure: [
              "1. イントロダクション",
              "2. メインコンテンツ",
              "3. 実例・デモ",
              "4. まとめ"
            ],
            successTips: [
              "明確な構成で伝える",
              "視聴者の関心を維持する",
              "実践的な内容を含める"
            ],
            recommendedLength: "10-15分",
            bestUploadTime: "金曜日 19:00",
            thumbnailSuggestion: "キャッチーなタイトルと関連画像",
            suggestedTags: [userPrompt, "動画", "YouTube", "チュートリアル"]
          };
        } catch (fallbackError) {
          console.error('フォールバックも失敗:', fallbackError);
        }
      }
      
      // 最終的なフォールバック
      return {
        title: `${userPrompt}に関する動画`,
        concept: "チャンネル分析を基にした動画企画",
        reasoning: "このチャンネルの視聴者層に適したコンテンツです",
        expectedPerformance: [
          "現在の平均視聴数を上回る可能性",
          "コメント数の増加が期待できる",
          "チャンネル登録者の増加につながる"
        ],
        structure: [
          "1. 導入（0:00-1:00）: 視聴者の興味を引く",
          "2. 本編（1:00-8:00）: メインコンテンツの展開",
          "3. 実践（8:00-10:00）: 具体例やデモンストレーション",
          "4. まとめ（10:00-12:00）: 要点整理と次回予告"
        ],
        successTips: [
          "過去の人気動画の要素を取り入れる",
          "視聴者からのコメントに応える内容にする",
          "チャンネルの独自性を前面に出す"
        ],
        recommendedLength: "10-15分",
        bestUploadTime: "金曜日 19:00-21:00",
        thumbnailSuggestion: "明るい色使いで視認性の高いデザイン",
        suggestedTags: ["動画企画", "YouTube", "コンテンツ制作"]
      };
    }
  }
}