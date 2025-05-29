import { UIManager } from './components/ui-manager.js';
import { ChartManager } from './components/chart-manager.js';
import { DataRenderer } from './components/data-renderer.js';
import { ContentIdeaManager } from './components/content-idea-manager.js';
import { createClientErrorMessage } from './utils/formatters.js';

class YouTubeAnalyzerApp {
  constructor() {
    this.uiManager = new UIManager();
    this.chartManager = new ChartManager();
    this.dataRenderer = new DataRenderer();
    this.contentIdeaManager = new ContentIdeaManager();
    this.currentData = null;
    this.lastCommentAnalysisData = null;
    
    this.initializeElements();
    this.bindEvents();
  }

  initializeElements() {
    this.form = document.getElementById('analyzeForm');
    this.urlInput = document.getElementById('channelUrl');
    this.analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
    this.exportDataBtn = document.getElementById('exportDataBtn');
    this.retryBtn = document.getElementById('retryBtn');
    this.analyzeCommentsBtn = document.getElementById('analyzeCommentsBtn');
    this.backToResultsBtn = document.getElementById('backToResultsBtn');
    this.generateIdeasBtn = document.getElementById('generateIdeasBtn');
    this.backToResultsFromIdeasBtn = document.getElementById('backToResultsFromIdeasBtn');
    this.generateAIVideoIdeasBtn = document.getElementById('generateAIVideoIdeasBtn');
    this.backToResultsFromAIBtn = document.getElementById('backToResultsFromAIBtn');
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.analyzeAnotherBtn.addEventListener('click', () => this.resetForm());
    this.exportDataBtn.addEventListener('click', () => this.exportData());
    this.retryBtn.addEventListener('click', () => this.resetForm());
    this.analyzeCommentsBtn.addEventListener('click', () => this.analyzeComments());
    this.backToResultsBtn.addEventListener('click', () => this.showChannelResults());
    
    // 条件付きでイベントリスナーを追加
    if (this.generateIdeasBtn) {
      this.generateIdeasBtn.addEventListener('click', () => this.generateContentIdeas());
    }
    this.backToResultsFromIdeasBtn.addEventListener('click', () => this.showChannelResults());
    
    // AI機能のイベントリスナー
    if (this.generateAIVideoIdeasBtn) {
      this.generateAIVideoIdeasBtn.addEventListener('click', () => this.generateAIVideoIdeas());
    }
    if (this.backToResultsFromAIBtn) {
      this.backToResultsFromAIBtn.addEventListener('click', () => this.showChannelResults());
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const url = this.urlInput.value.trim();
    if (!url) return;

    this.uiManager.showLoading();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        this.currentData = result.data;
        this.displayResults(result.data);
      } else {
        this.uiManager.showError(result.error || 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Request error:', error);
      const errorMessage = createClientErrorMessage(error);
      this.uiManager.showError(errorMessage);
    }
  }

  displayResults(data) {
    this.dataRenderer.populateChannelInfo(data.channel);
    this.dataRenderer.populateStatistics(data.channel.statistics);
    this.dataRenderer.populateVideos(data.recentVideos);
    this.dataRenderer.populateTopVideos(data.topVideos);
    this.dataRenderer.populateAnalytics(data.analytics);
    this.chartManager.createGrowthChart(data.channel);
    this.uiManager.showResults();
  }

  exportData() {
    if (!this.currentData) return;

    const exportData = {
      channel: this.currentData.channel,
      recentVideos: this.currentData.recentVideos,
      topVideos: this.currentData.topVideos,
      analytics: this.currentData.analytics,
      exportDate: new Date().toISOString(),
      exportedBy: 'YouTube Channel Analyzer'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `youtube-channel-${this.currentData.channel.id}-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);

    // Show success message
    this.uiManager.showTemporaryMessage('データをエクスポートしました！', 'success');
  }

  async analyzeComments() {
    if (!this.currentData || !this.currentData.channel) {
      this.uiManager.showError('チャンネルデータが見つかりません');
      return;
    }

    this.uiManager.showLoading();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      const response = await fetch('/api/analyze-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId: this.currentData.channel.id }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        this.displayCommentsAnalysis(result.data);
      } else {
        this.uiManager.showError(result.error || 'コメント分析でエラーが発生しました');
      }
    } catch (error) {
      console.error('Comment analysis error:', error);
      const errorMessage = createClientErrorMessage(error);
      this.uiManager.showError(errorMessage);
    }
  }

  displayCommentsAnalysis(data) {
    this.lastCommentAnalysisData = data; // コメント分析データを保存
    this.populateCommentsStatistics(data.statistics);
    this.populateCommentsList(data.topComments, 'topCommentsList');
    this.populateCommentsList(data.constructiveComments, 'constructiveCommentsList');
    this.populateCommentsList(data.improvementComments, 'improvementCommentsList');
    this.uiManager.showCommentsSection();
  }

  populateCommentsStatistics(stats) {
    document.getElementById('totalCommentsAnalyzed').textContent = stats.totalComments.toLocaleString();
    document.getElementById('averageLikes').textContent = stats.averageLikes.toLocaleString();
    document.getElementById('maxLikes').textContent = stats.maxLikes.toLocaleString();
  }

  populateCommentsList(comments, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!comments || comments.length === 0) {
      container.innerHTML = '<p class="no-comments">該当するコメントがありません</p>';
      return;
    }

    comments.forEach((comment, index) => {
      const commentElement = document.createElement('div');
      commentElement.className = 'comment-item';
      commentElement.innerHTML = `
        <div class="comment-header">
          <img src="${comment.authorProfileImageUrl || '/images/default-avatar.png'}" 
               alt="${comment.author}" class="comment-avatar">
          <div class="comment-meta">
            <span class="comment-author">${comment.author}</span>
            <span class="comment-likes"><i class="fas fa-thumbs-up"></i> ${comment.likeCount}</span>
          </div>
        </div>
        <div class="comment-content">
          <p class="comment-text">${comment.text}</p>
          <div class="comment-info">
            <span class="comment-video">動画: ${comment.videoTitle}</span>
            <span class="comment-date">${new Date(comment.publishedAt).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>
      `;
      container.appendChild(commentElement);
    });
  }

  async generateContentIdeas() {
    if (!this.currentData || !this.currentData.channel) {
      this.uiManager.showError('チャンネルデータが見つかりません');
      return;
    }

    this.uiManager.showContentIdeasSection();
    
    try {
      const channelId = this.currentData.channel.id;
      const comments = null; // Will be fetched by the API
      const topVideos = this.currentData.topVideos || null;
      
      await this.contentIdeaManager.generateContentIdeas(channelId, comments, topVideos);
    } catch (error) {
      console.error('Content ideas generation error:', error);
      const errorMessage = createClientErrorMessage(error);
      this.uiManager.showError(errorMessage);
    }
  }

  async generateAIVideoIdeas() {
    if (!this.currentData || !this.currentData.channel) {
      this.uiManager.showError('チャンネルデータが見つかりません。まずチャンネル分析を実行してください。');
      return;
    }

    try {
      this.uiManager.showLoading('AI分析・アイデア生成中...');
      
      // まずパフォーマンス分析を実行
      const performanceResponse = await fetch('/api/analyze-video-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: this.currentData.channel.id,
          maxVideos: 30
        })
      });

      const performanceResult = await performanceResponse.json();

      if (!performanceResult.success) {
        throw new Error(performanceResult.error || 'AI動画分析に失敗しました');
      }

      // 次にアイデア生成を実行
      const ideasResponse = await fetch('/api/generate-ai-video-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: this.currentData.channel.id
        })
      });

      const ideasResult = await ideasResponse.json();

      if (!ideasResult.success) {
        throw new Error(ideasResult.error || 'AI動画アイデア生成に失敗しました');
      }

      // 両方の結果を統合して表示
      const combinedData = {
        ...performanceResult.data,
        videoIdeas: ideasResult.data
      };

      this.displayAIAnalysisResults(combinedData);
      
    } catch (error) {
      console.error('AI analysis error:', error);
      const errorMessage = createClientErrorMessage(error);
      this.uiManager.showError(errorMessage);
    }
  }

  formatAIText(text) {
    if (!text) return '';
    
    let formatted = text
      // 見出し（##）を整形
      .replace(/^## (.*?)$/gm, '<h5 style="color: #667eea; margin: 20px 0 10px 0; font-weight: 600;">$1</h5>')
      // 見出し（###）を整形
      .replace(/^### (.*?)$/gm, '<h6 style="color: #2c3e50; margin: 15px 0 8px 0; font-weight: 600;">$1</h6>')
      // 太字を整形
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2c3e50;">$1</strong>')
      // 番号付きリスト（1. 2. 3.）を整形
      .replace(/^(\d+)\.\s+(.*?)$/gm, '<div style="margin: 8px 0; padding-left: 20px;"><strong style="color: #667eea;">$1.</strong> $2</div>')
      // ハイフンやアスタリスクのリストを日本語の箇条書きに変換
      .replace(/^[-*]\s+(.*?)$/gm, '<div style="margin: 6px 0; padding-left: 15px;">・ $1</div>')
      // 複数の改行を適切なスペースに変換
      .replace(/\n\s*\n/g, '<div style="margin: 15px 0;"></div>')
      // 単一の改行をスペースに変換
      .replace(/\n/g, '<br style="margin: 4px 0;">');
    
    return formatted;
  }
  
  displayAIAnalysisResults(data) {
    const section = document.getElementById('aiAnalysisSection');
    const performanceMetrics = document.getElementById('performance-metrics');
    const aiAnalysisText = document.getElementById('ai-analysis-text');
    const videoIdeasContainer = document.getElementById('video-ideas-container');
    
    // パフォーマンス指標を表示
    if (data.performanceMetrics) {
      performanceMetrics.innerHTML = `
        <div class="performance-metrics-grid">
          <div class="metric-item">
            <div class="metric-value">${data.performanceMetrics.totalVideos}</div>
            <div class="metric-label">分析動画数</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${data.performanceMetrics.averageViews.toLocaleString()}</div>
            <div class="metric-label">平均再生回数</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${data.performanceMetrics.averageLikes.toLocaleString()}</div>
            <div class="metric-label">平均いいね数</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${data.performanceMetrics.averageEngagementRate}%</div>
            <div class="metric-label">平均エンゲージメント率</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${data.performanceMetrics.uploadPattern.mostPopularDay}</div>
            <div class="metric-label">人気投稿曜日</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${data.performanceMetrics.uploadPattern.mostPopularHour}</div>
            <div class="metric-label">人気投稿時間</div>
          </div>
        </div>
        <div class="top-video-highlight">
          <h5>🏆 最高パフォーマンス動画</h5>
          <p><strong>${data.performanceMetrics.topPerformingVideo.title}</strong></p>
          <p>${data.performanceMetrics.topPerformingVideo.statistics.viewCount.toLocaleString()}回再生</p>
        </div>
      `;
    }
    
    // AI分析結果を表示
    if (data.aiAnalysis && data.aiAnalysis.analysis) {
      console.log('AI分析結果:', data.aiAnalysis.analysis); // デバッグ用
      aiAnalysisText.innerHTML = `
        <div class="ai-analysis-text">
          ${this.formatAIText(data.aiAnalysis.analysis)}
        </div>
      `;
    } else {
      aiAnalysisText.innerHTML = `
        <div class="ai-analysis-text">
          <p>AI分析結果の取得に失敗しました。</p>
        </div>
      `;
    }
    
    // 動画アイデア提案を表示
    if (data.videoIdeas && data.videoIdeas.ideas) {
      console.log('動画アイデア:', data.videoIdeas.ideas); // デバッグ用
      videoIdeasContainer.innerHTML = `
        <div class="ai-analysis-text">
          ${this.formatAIText(data.videoIdeas.ideas)}
        </div>
      `;
    } else {
      videoIdeasContainer.innerHTML = `
        <div class="ai-analysis-text">
          <p>動画アイデアの生成に失敗しました。</p>
        </div>
      `;
    }
    
    this.uiManager.showAIAnalysis();
  }

  displayAIVideoIdeas(data) {
    const videoIdeasContainer = document.getElementById('video-ideas-container');
    
    if (data.ideas) {
      videoIdeasContainer.innerHTML = `
        <div class="ai-analysis-text">
          ${this.formatAIText(data.ideas)}
        </div>
      `;
    }
    
    this.uiManager.showAIAnalysis();
  }

  showChannelResults() {
    this.uiManager.showResults();
  }

  resetForm() {
    this.dataRenderer.clearAnimations();
    this.chartManager.destroy();
    this.contentIdeaManager.clear();
    this.uiManager.resetForm();
    this.currentData = null;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new YouTubeAnalyzerApp();
  
  // Make content idea manager globally accessible for retry functionality
  window.contentIdeaManager = app.contentIdeaManager;
  
  // Add input validation feedback
  const urlInput = document.getElementById('channelUrl');
  
  urlInput.addEventListener('input', (e) => {
    const value = e.target.value;
    const isValid = value.includes('youtube.com') || value === '';
    
    if (value && !isValid) {
      urlInput.classList.add('invalid');
      urlInput.classList.remove('valid');
    } else {
      urlInput.classList.remove('invalid');
      urlInput.classList.add('valid');
    }
  });

  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      app.resetForm();
    }
  });
});