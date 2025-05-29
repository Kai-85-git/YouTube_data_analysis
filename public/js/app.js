import { UIManager } from './components/ui-manager.js';
import { ChartManager } from './components/chart-manager.js';
import { DataRenderer } from './components/data-renderer.js';
import { createClientErrorMessage } from './utils/errors.js';

class YouTubeAnalyzerApp {
  constructor() {
    this.uiManager = new UIManager();
    this.chartManager = new ChartManager();
    this.dataRenderer = new DataRenderer();
    this.currentData = null;
    
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
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.analyzeAnotherBtn.addEventListener('click', () => this.resetForm());
    this.exportDataBtn.addEventListener('click', () => this.exportData());
    this.retryBtn.addEventListener('click', () => this.resetForm());
    this.analyzeCommentsBtn.addEventListener('click', () => this.analyzeComments());
    this.backToResultsBtn.addEventListener('click', () => this.showChannelResults());
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

  showChannelResults() {
    this.uiManager.showResults();
  }

  resetForm() {
    this.dataRenderer.clearAnimations();
    this.chartManager.destroy();
    this.uiManager.resetForm();
    this.currentData = null;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new YouTubeAnalyzerApp();
  
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