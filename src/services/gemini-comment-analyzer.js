import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config.js';
import { YouTubeAnalyzerError } from '../utils/errors.js';

export class GeminiCommentAnalyzer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.gemini.model });
  }

  async analyzeVideoComments(comments, videoTitle) {
    try {
      // Prepare comments for Gemini analysis
      const commentTexts = comments.map(comment => {
        const snippet = comment.snippet.topLevelComment.snippet;
        return {
          text: snippet.textDisplay,
          author: snippet.authorDisplayName,
          likeCount: snippet.likeCount || 0,
          publishedAt: snippet.publishedAt
        };
      });

      // Sort by likes to get most relevant comments
      const sortedComments = commentTexts.sort((a, b) => b.likeCount - a.likeCount);
      const topComments = sortedComments.slice(0, 30); // Limit to top 30 for API

      const prompt = `
YouTubeの動画「${videoTitle}」のコメントを分析して、以下の3つのカテゴリーに分類してください。

【分析対象コメント】
${topComments.map(c => `${c.text} (👍${c.likeCount})`).join('\n')}

以下の基準で分類し、各カテゴリーから最も代表的なコメントを10個ずつ選んでください：

1. **人気コメント**: いいね数が多く、多くの視聴者に共感されているコメント
2. **建設的なコメント**: 動画に対する具体的な賞賛、感謝、学びなどポジティブな価値を含むコメント
3. **改善提案コメント**: 建設的な批判、改善案、リクエストなど今後の動画制作に役立つコメント

以下のJSON形式で回答してください：
{
  "topComments": [
    {
      "text": "コメント内容",
      "likeCount": いいね数,
      "reason": "選出理由"
    }
  ],
  "constructiveComments": [
    {
      "text": "コメント内容",
      "likeCount": いいね数,
      "reason": "選出理由"
    }
  ],
  "improvementComments": [
    {
      "text": "コメント内容",
      "likeCount": いいね数,
      "reason": "選出理由"
    }
  ],
  "summary": {
    "overallSentiment": "全体的な感情（ポジティブ/ネガティブ/中立）",
    "keyThemes": ["主要なテーマ1", "主要なテーマ2", "主要なテーマ3"],
    "audienceInsights": "視聴者層に関する洞察"
  }
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      let analysisData;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new YouTubeAnalyzerError('Failed to parse AI response', null);
      }

      // Format the response with original comment data
      const formatComments = (aiComments, originalComments) => {
        return aiComments.map(aiComment => {
          const original = originalComments.find(c => 
            c.text.includes(aiComment.text.substring(0, 20)) || 
            aiComment.text.includes(c.text.substring(0, 20))
          );
          
          if (original) {
            return {
              text: original.text,
              author: original.author,
              likeCount: original.likeCount,
              publishedAt: original.publishedAt,
              category: aiComment.category || 'analyzed',
              reason: aiComment.reason
            };
          }
          
          return {
            text: aiComment.text,
            likeCount: aiComment.likeCount || 0,
            category: aiComment.category || 'analyzed',
            reason: aiComment.reason
          };
        });
      };

      // Calculate statistics
      const statistics = {
        totalComments: comments.length,
        averageLikes: Math.round(commentTexts.reduce((sum, c) => sum + c.likeCount, 0) / commentTexts.length * 10) / 10,
        maxLikes: Math.max(...commentTexts.map(c => c.likeCount)),
        totalLikes: commentTexts.reduce((sum, c) => sum + c.likeCount, 0)
      };

      return {
        topComments: formatComments(analysisData.topComments || [], commentTexts),
        constructiveComments: formatComments(analysisData.constructiveComments || [], commentTexts),
        improvementComments: formatComments(analysisData.improvementComments || [], commentTexts),
        statistics,
        summary: analysisData.summary || {
          overallSentiment: 'ポジティブ',
          keyThemes: [],
          audienceInsights: ''
        }
      };

    } catch (error) {
      console.error('Gemini comment analysis error:', error);
      throw new YouTubeAnalyzerError(`Failed to analyze comments with AI: ${error.message}`, null);
    }
  }
}