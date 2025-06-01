export class PerformanceAnalyzer {
  calculateEngagementRate(video) {
    const stats = video.statistics;
    if (!stats) return 0;
    
    const views = parseInt(stats.viewCount) || 0;
    const likes = parseInt(stats.likeCount) || 0;
    const comments = parseInt(stats.commentCount) || 0;
    
    if (views === 0) return 0;
    
    return ((likes + comments) / views) * 100;
  }

  calculatePerformanceScore(video) {
    const views = parseInt(video.statistics?.viewCount) || 0;
    const likes = parseInt(video.statistics?.likeCount) || 0;
    const comments = parseInt(video.statistics?.commentCount) || 0;
    const engagementRate = this.calculateEngagementRate(video);
    
    // Weighted scoring
    const viewScore = Math.min(views / 1000000, 10) * 0.3;
    const likeScore = Math.min(likes / 100000, 10) * 0.3;
    const commentScore = Math.min(comments / 10000, 10) * 0.2;
    const engagementScore = Math.min(engagementRate, 10) * 0.2;
    
    return viewScore + likeScore + commentScore + engagementScore;
  }

  analyzeVideoPerformance(videos) {
    const performanceMetrics = videos.map(video => {
      const views = parseInt(video.statistics?.viewCount) || 0;
      const likes = parseInt(video.statistics?.likeCount) || 0;
      const comments = parseInt(video.statistics?.commentCount) || 0;
      const engagementRate = this.calculateEngagementRate(video);
      const performanceScore = this.calculatePerformanceScore(video);
      
      return {
        videoId: video.id,
        title: video.snippet?.title || 'Unknown',
        publishedAt: video.snippet?.publishedAt,
        views,
        likes,
        comments,
        engagementRate,
        performanceScore,
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url
      };
    });

    // Calculate averages
    const totalVideos = performanceMetrics.length;
    const avgViews = performanceMetrics.reduce((sum, v) => sum + v.views, 0) / totalVideos;
    const avgLikes = performanceMetrics.reduce((sum, v) => sum + v.likes, 0) / totalVideos;
    const avgComments = performanceMetrics.reduce((sum, v) => sum + v.comments, 0) / totalVideos;
    const avgEngagement = performanceMetrics.reduce((sum, v) => sum + v.engagementRate, 0) / totalVideos;

    // Find top performers
    const topByViews = [...performanceMetrics].sort((a, b) => b.views - a.views).slice(0, 5);
    const topByEngagement = [...performanceMetrics].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 5);
    const topByScore = [...performanceMetrics].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);

    // Analyze trends
    const monthlyData = this.analyzeMonthlyTrends(performanceMetrics);
    const categoryPerformance = this.analyzeCategoryPerformance(videos);

    return {
      totalVideos,
      averageMetrics: {
        views: Math.round(avgViews),
        likes: Math.round(avgLikes),
        comments: Math.round(avgComments),
        engagementRate: avgEngagement.toFixed(2)
      },
      topPerformers: {
        byViews: topByViews,
        byEngagement: topByEngagement,
        byOverallScore: topByScore
      },
      trends: {
        monthly: monthlyData,
        categories: categoryPerformance
      },
      allVideos: performanceMetrics
    };
  }

  analyzeMonthlyTrends(videos) {
    const monthlyData = {};
    
    videos.forEach(video => {
      const date = new Date(video.publishedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          videoCount: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          avgEngagement: 0
        };
      }
      
      monthlyData[monthKey].videoCount++;
      monthlyData[monthKey].totalViews += video.views;
      monthlyData[monthKey].totalLikes += video.likes;
      monthlyData[monthKey].totalComments += video.comments;
      monthlyData[monthKey].avgEngagement += video.engagementRate;
    });

    // Calculate averages
    Object.values(monthlyData).forEach(month => {
      month.avgViews = Math.round(month.totalViews / month.videoCount);
      month.avgEngagement = month.avgEngagement / month.videoCount;
    });

    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
  }

  analyzeCategoryPerformance(videos) {
    // This would require category data from videos
    // For now, return empty analysis
    return {
      message: "Category analysis requires additional video metadata"
    };
  }

  identifyContentPatterns(videos) {
    const patterns = {
      bestPerformingTitles: [],
      optimalUploadTimes: [],
      successfulFormats: []
    };

    // Analyze title patterns
    const titleWords = {};
    videos.forEach(video => {
      const words = video.snippet?.title?.toLowerCase().split(/\s+/) || [];
      words.forEach(word => {
        if (word.length > 3) {
          if (!titleWords[word]) {
            titleWords[word] = { count: 0, totalViews: 0 };
          }
          titleWords[word].count++;
          titleWords[word].totalViews += parseInt(video.statistics?.viewCount) || 0;
        }
      });
    });

    patterns.bestPerformingTitles = Object.entries(titleWords)
      .map(([word, data]) => ({
        word,
        frequency: data.count,
        avgViews: Math.round(data.totalViews / data.count)
      }))
      .sort((a, b) => b.avgViews - a.avgViews)
      .slice(0, 10);

    // Analyze upload times
    const uploadHours = {};
    videos.forEach(video => {
      const hour = new Date(video.snippet?.publishedAt).getHours();
      if (!uploadHours[hour]) {
        uploadHours[hour] = { count: 0, totalViews: 0 };
      }
      uploadHours[hour].count++;
      uploadHours[hour].totalViews += parseInt(video.statistics?.viewCount) || 0;
    });

    patterns.optimalUploadTimes = Object.entries(uploadHours)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        uploads: data.count,
        avgViews: Math.round(data.totalViews / data.count)
      }))
      .sort((a, b) => b.avgViews - a.avgViews);

    return patterns;
  }
}