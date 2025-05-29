import { YouTubeAnalyzerError } from '../utils/errors.js';

export class CommentAnalyzer {
  constructor() {
    this.constructiveKeywords = [
      '素晴らしい', 'すごい', '感動', '勉強になる', '参考になる', 'ありがとう', 
      '助かる', '分かりやすい', '面白い', '良い', 'いい', '最高', '神', 'ナイス',
      'GJ', 'good', 'great', 'awesome', 'amazing', 'helpful', 'useful', 'thanks'
    ];
    
    this.improvementKeywords = [
      '改善', 'もっと', 'できれば', '希望', '要望', '提案', '次回', '今度',
      'もう少し', '追加', '詳しく', 'やってほしい', 'お願い', 'リクエスト',
      '音量', '画質', '編集', 'BGM', 'もしよろしければ', 'もしよければ'
    ];
  }

  analyzeComments(comments) {
    try {
      const processedComments = this.processComments(comments);
      const topComments = this.getTopComments(processedComments);
      const constructiveComments = this.getConstructiveComments(processedComments);
      const improvementComments = this.getImprovementComments(processedComments);
      const statistics = this.calculateStatistics(processedComments);

      return {
        totalComments: processedComments.length,
        topComments,
        constructiveComments,
        improvementComments,
        statistics
      };
    } catch (error) {
      throw new YouTubeAnalyzerError(`Failed to analyze comments: ${error.message}`, null);
    }
  }

  processComments(comments) {
    return comments.map(comment => {
      const snippet = comment.snippet.topLevelComment.snippet;
      return {
        id: comment.id,
        text: snippet.textDisplay,
        author: snippet.authorDisplayName,
        authorChannelUrl: snippet.authorChannelUrl,
        authorProfileImageUrl: snippet.authorProfileImageUrl,
        likeCount: snippet.likeCount || 0,
        publishedAt: snippet.publishedAt,
        videoTitle: comment.videoTitle,
        videoId: comment.videoId,
        score: this.calculateCommentScore(snippet.textDisplay, snippet.likeCount || 0)
      };
    });
  }

  calculateCommentScore(text, likeCount) {
    const textLower = text.toLowerCase();
    let score = likeCount;
    
    // テキストの長さによるボーナス
    if (text.length > 50 && text.length < 500) {
      score += 2;
    }
    
    // 建設的なキーワードボーナス
    this.constructiveKeywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        score += 3;
      }
    });
    
    return score;
  }

  getTopComments(comments, limit = 10) {
    return comments
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit)
      .map(comment => ({
        ...comment,
        category: 'popular'
      }));
  }

  getConstructiveComments(comments, limit = 10) {
    const constructive = comments.filter(comment => {
      const textLower = comment.text.toLowerCase();
      return this.constructiveKeywords.some(keyword => 
        textLower.includes(keyword)
      ) && comment.text.length > 20;
    });

    return constructive
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(comment => ({
        ...comment,
        category: 'constructive'
      }));
  }

  getImprovementComments(comments, limit = 10) {
    const improvement = comments.filter(comment => {
      const textLower = comment.text.toLowerCase();
      return this.improvementKeywords.some(keyword => 
        textLower.includes(keyword)
      ) && comment.text.length > 15;
    });

    return improvement
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit)
      .map(comment => ({
        ...comment,
        category: 'improvement'
      }));
  }

  calculateStatistics(comments) {
    if (comments.length === 0) {
      return {
        totalComments: 0,
        averageLikes: 0,
        maxLikes: 0,
        totalLikes: 0
      };
    }

    const totalLikes = comments.reduce((sum, comment) => sum + comment.likeCount, 0);
    const maxLikes = Math.max(...comments.map(comment => comment.likeCount));
    const averageLikes = Math.round(totalLikes / comments.length * 10) / 10;

    return {
      totalComments: comments.length,
      averageLikes,
      maxLikes,
      totalLikes
    };
  }
}