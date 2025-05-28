class YouTubeAnalyzerApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentData = null;
    }

    initializeElements() {
        this.form = document.getElementById('analyzeForm');
        this.urlInput = document.getElementById('channelUrl');
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        this.analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
        this.exportDataBtn = document.getElementById('exportDataBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.errorMessage = document.getElementById('errorMessage');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.analyzeAnotherBtn.addEventListener('click', () => this.resetForm());
        this.exportDataBtn.addEventListener('click', () => this.exportData());
        this.retryBtn.addEventListener('click', () => this.resetForm());
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const url = this.urlInput.value.trim();
        if (!url) return;

        this.showLoading();
        
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
                this.showError(result.error || 'エラーが発生しました');
            }
        } catch (error) {
            console.error('Request error:', error);
            
            let errorMessage = 'エラーが発生しました。';
            
            if (error.name === 'AbortError') {
                errorMessage = 'リクエストがタイムアウトしました。ネットワーク接続を確認して再試行してください。';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'サーバーに接続できませんでした。サーバーが起動しているか確認してください。';
            } else if (error.message.includes('NetworkError')) {
                errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage);
        }
    }

    showLoading() {
        this.hideAllSections();
        this.loadingSection.classList.remove('hidden');
    }

    showError(message) {
        this.hideAllSections();
        this.errorMessage.textContent = message;
        this.errorSection.classList.remove('hidden');
    }

    displayResults(data) {
        this.hideAllSections();
        this.populateChannelInfo(data.channel);
        this.populateStatistics(data.channel.statistics);
        this.populateVideos(data.recentVideos);
        this.populateTopVideos(data.topVideos);
        this.populateAnalytics(data.analytics);
        this.createGrowthChart(data.channel);
        this.resultsSection.classList.remove('hidden');
        
        // Smooth scroll to results
        setTimeout(() => {
            this.resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    populateChannelInfo(channel) {
        const thumbnail = channel.thumbnails?.high?.url || 
                         channel.thumbnails?.medium?.url || 
                         channel.thumbnails?.default?.url ||
                         'https://via.placeholder.com/100?text=No+Image';
        
        document.getElementById('channelThumbnail').src = thumbnail;
        document.getElementById('channelTitle').textContent = channel.title;
        document.getElementById('channelId').textContent = `チャンネルID: ${channel.id}`;
        
        const createdDate = new Date(channel.publishedAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('channelCreated').textContent = `作成日: ${createdDate}`;
        
        if (channel.customUrl) {
            document.getElementById('channelUrl').textContent = `URL: ${channel.customUrl}`;
        } else {
            document.getElementById('channelUrl').textContent = '';
        }
        
        const description = channel.description || 'チャンネルの説明がありません';
        document.getElementById('channelDescription').textContent = 
            description.length > 300 ? description.substring(0, 300) + '...' : description;
    }

    populateStatistics(stats) {
        this.animateNumber('subscriberCount', stats.subscriberCount);
        this.animateNumber('viewCount', stats.viewCount);
        this.animateNumber('videoCount', stats.videoCount);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const duration = 2000; // 2 seconds
        const steps = 60;
        const stepValue = targetValue / steps;
        let currentValue = 0;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            currentValue += stepValue;
            
            if (currentStep >= steps) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            element.textContent = this.formatNumber(Math.floor(currentValue));
        }, duration / steps);
    }

    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    }

    populateVideos(videos) {
        const videosGrid = document.getElementById('videosGrid');
        videosGrid.innerHTML = '';

        videos.slice(0, 6).forEach(video => {
            const videoCard = this.createVideoCard(video);
            videosGrid.appendChild(videoCard);
        });
    }

    createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        
        const thumbnail = video.thumbnails?.high?.url || 
                         video.thumbnails?.medium?.url || 
                         video.thumbnails?.default?.url ||
                         'https://via.placeholder.com/320x180?text=No+Image';
        
        const publishedDate = new Date(video.publishedAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnail}" alt="${video.title}" loading="lazy">
            </div>
            <div class="video-info">
                <h4 class="video-title">${video.title}</h4>
                <p class="video-date">${publishedDate}</p>
            </div>
        `;

        // Add click event to open video
        card.addEventListener('click', () => {
            window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
        });

        card.style.cursor = 'pointer';
        
        return card;
    }

    populateTopVideos(topVideos) {
        const topVideosList = document.getElementById('topVideosList');
        topVideosList.innerHTML = '';

        if (!topVideos || topVideos.length === 0) {
            topVideosList.innerHTML = '<p style="text-align: center; color: #666;">TOP動画データが取得できませんでした</p>';
            return;
        }

        topVideos.forEach((video, index) => {
            const topVideoItem = this.createTopVideoItem(video, index + 1);
            topVideosList.appendChild(topVideoItem);
        });
    }

    createTopVideoItem(video, rank) {
        const item = document.createElement('div');
        item.className = 'top-video-item';
        
        const thumbnail = video.thumbnails?.high?.url || 
                         video.thumbnails?.medium?.url || 
                         video.thumbnails?.default?.url ||
                         'https://via.placeholder.com/320x180?text=No+Image';

        const publishedDate = new Date(video.publishedAt).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const viewCount = video.statistics?.viewCount || 0;
        const likeCount = video.statistics?.likeCount || 0;
        const commentCount = video.statistics?.commentCount || 0;

        let rankClass = '';
        if (rank === 1) rankClass = 'rank-1';
        else if (rank === 2) rankClass = 'rank-2';
        else if (rank === 3) rankClass = 'rank-3';

        item.innerHTML = `
            <div class="video-rank ${rankClass}">${rank}</div>
            <div class="top-video-thumbnail">
                <img src="${thumbnail}" alt="${video.title}" loading="lazy">
            </div>
            <div class="top-video-info">
                <h4 class="top-video-title">${video.title}</h4>
                <div class="top-video-stats">
                    <div class="top-video-stat">
                        <i class="fas fa-eye"></i>
                        <span>${this.formatNumber(viewCount)}</span>
                    </div>
                    <div class="top-video-stat">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${this.formatNumber(likeCount)}</span>
                    </div>
                    <div class="top-video-stat">
                        <i class="fas fa-comment"></i>
                        <span>${this.formatNumber(commentCount)}</span>
                    </div>
                    <div class="top-video-stat">
                        <i class="fas fa-calendar"></i>
                        <span>${publishedDate}</span>
                    </div>
                </div>
            </div>
        `;

        // Add click event to open video
        item.addEventListener('click', () => {
            window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
        });

        return item;
    }

    populateAnalytics(analytics) {
        if (!analytics) {
            document.getElementById('averageViews').textContent = '-';
            document.getElementById('totalLikes').textContent = '-';
            document.getElementById('totalComments').textContent = '-';
            document.getElementById('popularDay').textContent = '-';
            document.getElementById('uploadFrequency').textContent = '-';
            return;
        }

        document.getElementById('averageViews').textContent = this.formatNumber(analytics.averageViews);
        document.getElementById('totalLikes').textContent = this.formatNumber(analytics.totalLikes);
        document.getElementById('totalComments').textContent = this.formatNumber(analytics.totalComments);
        document.getElementById('popularDay').textContent = analytics.mostPopularDay || '-';
        
        const frequency = analytics.uploadFrequency ? `約${analytics.uploadFrequency}日に1回` : '-';
        document.getElementById('uploadFrequency').textContent = frequency;
    }

    createGrowthChart(channel) {
        const ctx = document.getElementById('growthChart').getContext('2d');
        
        // 登録者数の推移データを模擬的に生成（実際のAPIでは過去のデータが取得できないため）
        const currentSubs = channel.statistics.subscriberCount;
        const chartData = this.generateMockGrowthData(currentSubs);

        // 既存のチャートがあれば破棄
        if (window.growthChart) {
            window.growthChart.destroy();
        }

        window.growthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '登録者数',
                    data: chartData.data,
                    borderColor: '#FF4500',
                    backgroundColor: 'rgba(255, 69, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#FF4500',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#FF4500',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `登録者数: ${context.parsed.y.toLocaleString()}人`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    generateMockGrowthData(currentSubs) {
        const months = ['6ヶ月前', '5ヶ月前', '4ヶ月前', '3ヶ月前', '2ヶ月前', '1ヶ月前', '現在'];
        const data = [];
        
        // 成長率を考慮した過去データの生成
        const growthRate = 0.85; // 月間成長率
        let prevValue = currentSubs;
        
        for (let i = months.length - 1; i >= 0; i--) {
            if (i === months.length - 1) {
                data.unshift(currentSubs);
            } else {
                prevValue = Math.round(prevValue * growthRate);
                data.unshift(prevValue);
            }
        }
        
        return {
            labels: months,
            data: data
        };
    }

    exportData() {
        if (!this.currentData) return;

        const exportData = {
            channel: this.currentData.channel,
            recentVideos: this.currentData.recentVideos,
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
        this.showTemporaryMessage('データをエクスポートしました！', 'success');
    }

    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message temp-message-${type}`;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }

    resetForm() {
        this.hideAllSections();
        this.urlInput.value = '';
        this.urlInput.focus();
        this.currentData = null;
        
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    hideAllSections() {
        this.loadingSection.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }
}

// CSS animations are now defined in styles.css

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeAnalyzerApp();
});

// Add some interactive enhancements
document.addEventListener('DOMContentLoaded', () => {
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
            const app = window.youtubeApp;
            if (app) {
                app.resetForm();
            }
        }
    });

    // Store app instance globally for keyboard shortcuts
    window.youtubeApp = new YouTubeAnalyzerApp();
});