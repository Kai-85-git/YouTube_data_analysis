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
    
    // Video selection elements
    this.videoSelect = document.getElementById('videoSelect');
    this.analyzeVideoCommentsBtn = document.getElementById('analyzeVideoCommentsBtn');
    
    // Settings elements
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.saveApiKeysBtn = document.getElementById('saveApiKeysBtn');
    this.cancelApiKeysBtn = document.getElementById('cancelApiKeysBtn');
    this.youtubeApiKeyInput = document.getElementById('youtubeApiKey');
    this.geminiApiKeyInput = document.getElementById('geminiApiKey');
  }

  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.analyzeAnotherBtn.addEventListener('click', () => this.resetForm());
    this.exportDataBtn.addEventListener('click', () => this.exportData());
    this.retryBtn.addEventListener('click', () => this.resetForm());
    this.analyzeCommentsBtn.addEventListener('click', () => this.analyzeComments());
    this.backToResultsBtn.addEventListener('click', () => this.showChannelResults());
    
    // Video selection event listener
    if (this.analyzeVideoCommentsBtn) {
      this.analyzeVideoCommentsBtn.addEventListener('click', () => this.analyzeVideoComments());
    }
    
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
    
    // Settings event listeners
    this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.closeModalBtn.addEventListener('click', () => this.closeSettingsModal());
    this.cancelApiKeysBtn.addEventListener('click', () => this.closeSettingsModal());
    this.saveApiKeysBtn.addEventListener('click', () => this.saveApiKeys());
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettingsModal();
      }
    });
    
    // Load saved API keys on startup
    this.loadApiKeys();
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
        body: JSON.stringify({ 
          url,
          youtubeApiKey: localStorage.getItem('YOUTUBE_API_KEY'),
          geminiApiKey: localStorage.getItem('GEMINI_API_KEY')
        }),
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
        body: JSON.stringify({ 
          channelId: this.currentData.channel.id,
          youtubeApiKey: localStorage.getItem('YOUTUBE_API_KEY'),
          geminiApiKey: localStorage.getItem('GEMINI_API_KEY')
        }),
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
    
    // Populate video dropdown
    this.populateVideoDropdown();
    
    this.uiManager.showCommentsSection();
  }
  
  populateVideoDropdown() {
    if (!this.currentData || !this.currentData.topVideos) return;
    
    this.videoSelect.innerHTML = '<option value="">動画を選択してください...</option>';
    
    // Helper function to truncate title
    const truncateTitle = (title, maxLength = 50) => {
      if (title.length <= maxLength) return title;
      return title.substring(0, maxLength) + '...';
    };
    
    // Add top videos to dropdown
    this.currentData.topVideos.forEach(video => {
      const option = document.createElement('option');
      option.value = video.id;
      const truncatedTitle = truncateTitle(video.title);
      option.textContent = `${truncatedTitle} (再生数: ${video.statistics.viewCount.toLocaleString()})`;
      option.title = video.title; // Full title on hover
      this.videoSelect.appendChild(option);
    });
    
    // Also add recent videos if available
    if (this.currentData.recentVideos) {
      this.currentData.recentVideos.forEach(video => {
        // Check if video is not already in dropdown
        if (!this.currentData.topVideos.find(v => v.id === video.id)) {
          const option = document.createElement('option');
          option.value = video.id;
          option.textContent = truncateTitle(video.title);
          option.title = video.title; // Full title on hover
          this.videoSelect.appendChild(option);
        }
      });
    }
  }
  
  async analyzeVideoComments() {
    const videoId = this.videoSelect.value;
    if (!videoId) {
      this.showTempMessage('動画を選択してください', 'error');
      return;
    }
    
    this.showTempMessage('動画のコメントを分析中...', 'info');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('/api/analyze-video-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          videoId,
          youtubeApiKey: localStorage.getItem('YOUTUBE_API_KEY'),
          geminiApiKey: localStorage.getItem('GEMINI_API_KEY')
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.displayVideoCommentsAnalysis(result.data);
        this.showTempMessage('コメント分析が完了しました', 'success');
      } else {
        this.showTempMessage(result.error || 'エラーが発生しました', 'error');
      }
    } catch (error) {
      console.error('Video comment analysis error:', error);
      const errorMessage = createClientErrorMessage(error);
      this.showTempMessage(errorMessage, 'error');
    }
  }
  
  displayVideoCommentsAnalysis(data) {
    // Update statistics with video-specific data
    this.populateCommentsStatistics(data.statistics);
    
    // Display AI summary if available
    if (data.summary) {
      this.displayAISummary(data.summary);
    }
    
    // Update comment lists with video title in header
    const videoTitle = data.videoTitle || '選択した動画';
    
    // Add video title to each section
    const sections = ['topCommentsList', 'constructiveCommentsList', 'improvementCommentsList'];
    sections.forEach(sectionId => {
      const container = document.getElementById(sectionId);
      if (container) {
        const header = container.parentElement.querySelector('h4');
        if (header) {
          header.innerHTML = header.innerHTML.split('(')[0] + ` (${videoTitle})`;
        }
      }
    });
    
    // Populate comments
    this.populateCommentsList(data.topComments, 'topCommentsList');
    this.populateCommentsList(data.constructiveComments, 'constructiveCommentsList');
    this.populateCommentsList(data.improvementComments, 'improvementCommentsList');
  }
  
  displayAISummary(summary) {
    const aiSummaryCard = document.getElementById('aiSummaryCard');
    if (!aiSummaryCard) return;
    
    // Show the card
    aiSummaryCard.classList.remove('hidden');
    
    // Update sentiment
    const sentimentElement = document.getElementById('overallSentiment');
    if (sentimentElement && summary.overallSentiment) {
      sentimentElement.textContent = summary.overallSentiment;
      sentimentElement.className = 'value';
      
      // Add color based on sentiment
      if (summary.overallSentiment.includes('ポジティブ')) {
        sentimentElement.style.color = '#4CAF50';
      } else if (summary.overallSentiment.includes('ネガティブ')) {
        sentimentElement.style.color = '#f44336';
      } else {
        sentimentElement.style.color = '#FF9800';
      }
    }
    
    // Update key themes
    const themesElement = document.getElementById('keyThemes');
    if (themesElement && summary.keyThemes && summary.keyThemes.length > 0) {
      themesElement.innerHTML = summary.keyThemes.map(theme => 
        `<span>${theme}</span>`
      ).join('');
    }
    
    // Update audience insights
    const insightsElement = document.getElementById('audienceInsights');
    if (insightsElement && summary.audienceInsights) {
      insightsElement.textContent = summary.audienceInsights;
    }
  }
  
  showTempMessage(message, type = 'info') {
    const tempMsg = document.createElement('div');
    tempMsg.className = `temp-message temp-message-${type}`;
    tempMsg.textContent = message;
    document.body.appendChild(tempMsg);
    
    setTimeout(() => {
      tempMsg.style.animation = 'slideOutRight 0.3s ease-out forwards';
      setTimeout(() => tempMsg.remove(), 300);
    }, 3000);
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
          maxVideos: 30,
          youtubeApiKey: localStorage.getItem('YOUTUBE_API_KEY'),
          geminiApiKey: localStorage.getItem('GEMINI_API_KEY')
        })
      });

      const performanceResult = await performanceResponse.json();

      if (!performanceResult.success) {
        throw new Error(performanceResult.error || 'AI動画分析に失敗しました');
      }

      // 次にアイデア生成を実行（既存の分析データを渡す）
      const ideasResponse = await fetch('/api/generate-ai-video-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: this.currentData.channel.id,
          youtubeApiKey: localStorage.getItem('YOUTUBE_API_KEY'),
          geminiApiKey: localStorage.getItem('GEMINI_API_KEY'),
          analysisData: performanceResult.data // 既存の分析データを渡す
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
    
    // 動画アイデア提案セクションをインタラクティブに変更
    this.currentAIAnalysisData = data; // AI分析データを保存
    videoIdeasContainer.innerHTML = `
      <div class="custom-video-idea-form">
        <p class="form-description">チャンネル分析結果を基に、作りたい動画のアイデアを入力してください。Gemini AIが最適な動画企画を提案します。</p>
        <textarea 
          id="aiVideoIdeaPrompt" 
          placeholder="例：「初心者向けのReact解説動画」「最新のNext.js機能を使ったチュートリアル」「視聴者からの質問に答えるQ&A動画」など..." 
          rows="3"
        ></textarea>
        <button id="generateAIVideoIdea" class="generate-btn">
          <span class="btn-icon">🤖</span>
          AIに動画アイデアを提案してもらう
        </button>
        <div id="aiVideoIdeaResult" class="ai-video-idea-result"></div>
      </div>
    `;
    
    // イベントリスナーを追加
    const generateBtn = document.getElementById('generateAIVideoIdea');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateCustomAIVideoIdea());
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

  async generateCustomAIVideoIdea() {
    const promptInput = document.getElementById('aiVideoIdeaPrompt');
    const resultContainer = document.getElementById('aiVideoIdeaResult');
    const generateBtn = document.getElementById('generateAIVideoIdea');
    
    if (!promptInput || !promptInput.value.trim()) {
      alert('動画のアイデアについて入力してください');
      return;
    }

    const userPrompt = promptInput.value.trim();
    
    // ボタンを無効化してローディング状態に
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading-spinner-small"></span> 生成中...';
    resultContainer.innerHTML = '<div class="generating-message">チャンネル分析結果を基にアイデアを生成しています...</div>';

    try {
      // 必要最小限のデータのみを抽出
      const minimalAnalysisData = {
        performanceMetrics: {
          averageViews: this.currentAIAnalysisData?.performanceMetrics?.averageViews,
          averageLikes: this.currentAIAnalysisData?.performanceMetrics?.averageLikes,
          averageEngagementRate: this.currentAIAnalysisData?.performanceMetrics?.averageEngagementRate,
          uploadPattern: this.currentAIAnalysisData?.performanceMetrics?.uploadPattern,
          topPerformingVideo: {
            title: this.currentAIAnalysisData?.performanceMetrics?.topPerformingVideo?.title
          }
        }
      };

      const response = await fetch('/api/generate-ai-channel-video-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt,
          channelId: this.currentData.channel.id,
          analysisData: minimalAnalysisData, // 最小限のデータのみ送信
          youtubeApiKey: localStorage.getItem('YOUTUBE_API_KEY'),
          geminiApiKey: localStorage.getItem('GEMINI_API_KEY')
        })
      });

      const result = await response.json();

      if (result.success) {
        this.renderAIVideoIdeaResult(result.data);
      } else {
        resultContainer.innerHTML = `<div class="error-message">❌ ${result.error || 'アイデア生成に失敗しました'}</div>`;
      }
    } catch (error) {
      console.error('AI video idea generation error:', error);
      resultContainer.innerHTML = '<div class="error-message">❌ ネットワークエラーが発生しました</div>';
    } finally {
      // ボタンを元に戻す
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span class="btn-icon">🤖</span> AIに動画アイデアを提案してもらう';
    }
  }

  renderAIVideoIdeaResult(ideaData) {
    const resultContainer = document.getElementById('aiVideoIdeaResult');
    
    resultContainer.innerHTML = `
      <div class="ai-video-idea-card">
        <div class="ai-idea-header">
          <span class="ai-badge">Gemini AI提案</span>
          <h4 class="ai-idea-title">${ideaData.title}</h4>
        </div>
        <div class="ai-idea-content">
          <div class="idea-section">
            <h5>動画コンセプト</h5>
            <p>${ideaData.concept}</p>
          </div>
          
          <div class="idea-section">
            <h5>なぜこの動画がおすすめか</h5>
            <p>${ideaData.reasoning}</p>
          </div>
          
          <div class="idea-section">
            <h5>期待される成果</h5>
            <ul class="performance-expectations">
              ${ideaData.expectedPerformance.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          
          <div class="idea-section">
            <h5>動画構成案</h5>
            <ul class="video-structure">
              ${ideaData.structure.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          
          <div class="idea-section">
            <h5>成功のポイント</h5>
            <ul class="success-tips">
              ${ideaData.successTips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
          </div>
          
          <div class="idea-meta">
            <span class="meta-item">推奨時間: ${ideaData.recommendedLength}</span>
            <span class="meta-item">最適な投稿日: ${ideaData.bestUploadTime}</span>
            <span class="meta-item">サムネイル案: ${ideaData.thumbnailSuggestion}</span>
          </div>
          
          <div class="idea-tags">
            ${ideaData.suggestedTags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
          
          <div class="idea-actions">
            <button class="regenerate-ai-btn" onclick="document.getElementById('generateAIVideoIdea').click()">
              🔄 別のアイデアを生成
            </button>
          </div>
        </div>
      </div>
    `;
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

  // Settings modal methods
  openSettingsModal() {
    this.settingsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  }

  closeSettingsModal() {
    this.settingsModal.classList.add('hidden');
    document.body.style.overflow = ''; // Restore body scroll
  }

  loadApiKeys() {
    // Load API keys from localStorage
    const youtubeApiKey = localStorage.getItem('YOUTUBE_API_KEY');
    const geminiApiKey = localStorage.getItem('GEMINI_API_KEY');
    
    if (youtubeApiKey) {
      this.youtubeApiKeyInput.value = youtubeApiKey;
    }
    if (geminiApiKey) {
      this.geminiApiKeyInput.value = geminiApiKey;
    }
  }

  saveApiKeys() {
    const youtubeApiKey = this.youtubeApiKeyInput.value.trim();
    const geminiApiKey = this.geminiApiKeyInput.value.trim();
    
    // Save to localStorage
    if (youtubeApiKey) {
      localStorage.setItem('YOUTUBE_API_KEY', youtubeApiKey);
    } else {
      localStorage.removeItem('YOUTUBE_API_KEY');
    }
    
    if (geminiApiKey) {
      localStorage.setItem('GEMINI_API_KEY', geminiApiKey);
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
    }
    
    // Show success message
    this.showTemporaryMessage('APIキーが保存されました');
    
    // Close modal
    this.closeSettingsModal();
  }

  showTemporaryMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'temp-message temp-message-success';
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      messageEl.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      messageEl.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(messageEl);
      }, 300);
    }, 3000);
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