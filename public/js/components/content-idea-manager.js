export class ContentIdeaManager {
    constructor() {
        this.currentData = null;
        this.isLoading = false;
        this.lastCommentAnalysisData = null;
    }

    async generateContentIdeas(channelId, comments = null, topVideos = null) {
        this.isLoading = true;
        this.showLoadingState();

        try {
            const response = await fetch('/api/generate-content-ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channelId,
                    comments,
                    topVideos
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentData = result.data;
                this.renderContentIdeas(result.data);
                return result.data;
            } else {
                this.showError(result.error || '動画アイデア生成に失敗しました');
                return null;
            }
        } catch (error) {
            console.error('Content idea generation error:', error);
            this.showError('ネットワークエラーが発生しました');
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    renderContentIdeas(data) {
        const container = document.getElementById('content-ideas-container');
        if (!container) {
            console.error('Content ideas container not found');
            return;
        }

        container.innerHTML = this.generateContentIdeasHTML(data);
        this.attachEventListeners();
    }

    async generateContentIdeasFromComments(commentAnalysisData, channelVideos) {
        this.isLoading = true;
        this.showLoadingState();
        this.lastCommentAnalysisData = commentAnalysisData;

        try {
            const response = await fetch('/api/generate-content-ideas-from-comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    commentAnalysisData,
                    channelVideos
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentData = result.data;
                this.renderContentIdeasFromAnalysis(result.data);
                return result.data;
            } else {
                this.showError(result.error || 'AI分析に失敗しました');
                return null;
            }
        } catch (error) {
            console.error('AI content analysis error:', error);
            this.showError('ネットワークエラーが発生しました');
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    renderContentIdeasFromAnalysis(data) {
        const container = document.getElementById('content-ideas-container');
        if (!container) {
            console.error('Content ideas container not found');
            return;
        }

        container.innerHTML = this.generateContentIdeasFromAnalysisHTML(data);
        this.attachEventListeners();
    }

    generateContentIdeasFromAnalysisHTML(data) {
        const { analysis, quickIdeas, seriesIdeas, optimizationTips } = data;

        return `
            <div class="content-ideas-section">
                <h2 class="section-title">🤖 AI分析による次の動画アイデア</h2>
                <p class="analysis-intro">コメント分析結果を基に、Gemini AIが具体的な動画アイデアを提案しました</p>
                
                <!-- 視聴者インサイト -->
                <div class="viewer-insights-section">
                    <h3 class="subsection-title">👥 視聴者インサイト</h3>
                    <div class="insights-grid">
                        ${analysis.viewerInsights.map(insight => `
                            <div class="insight-card priority-${insight.priority}">
                                <div class="insight-header">
                                    <h4 class="insight-text">${insight.insight}</h4>
                                    <span class="priority-badge ${insight.priority}">優先度: ${insight.priority}</span>
                                </div>
                                <p class="insight-evidence"><strong>根拠:</strong> ${insight.evidence}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="analysis-summary">
                        <div class="content-gaps">
                            <h4>📊 不足しているコンテンツ</h4>
                            <div class="gaps-tags">
                                ${analysis.contentGaps.map(gap => `<span class="gap-tag">${gap}</span>`).join('')}
                            </div>
                        </div>
                        
                        <div class="trending-topics">
                            <h4>🔥 注目トピック</h4>
                            <div class="topics-tags">
                                ${analysis.trendingTopics.map(topic => `<span class="topic-tag">${topic}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- AIが提案する動画アイデア -->
                <div class="ai-ideas-section">
                    <h3 class="subsection-title">📹 AI提案：今すぐ作れる動画</h3>
                    <div class="ai-ideas-grid">
                        ${quickIdeas.map(idea => `
                            <div class="ai-idea-card">
                                <div class="idea-header">
                                    <span class="ai-icon">🤖</span>
                                    <h4 class="idea-title">${idea.title}</h4>
                                </div>
                                <div class="idea-details">
                                    <p class="idea-reason"><strong>提案理由:</strong> ${idea.reason}</p>
                                    <p class="idea-prediction">📈 予想: 現在の平均×${idea.estimatedViews}の視聴</p>
                                    <p class="target-audience">🎯 <strong>ターゲット:</strong> ${idea.targetAudience}</p>
                                    
                                    <div class="idea-meta">
                                        <span class="production-time">⏱️ ${idea.productionTime}</span>
                                        <span class="difficulty ${idea.difficulty}">🎯 ${idea.difficulty}</span>
                                    </div>
                                    
                                    <div class="key-points">
                                        <h5>📝 重要ポイント:</h5>
                                        <ul>
                                            ${idea.keyPoints.map(point => `<li>${point}</li>`).join('')}
                                        </ul>
                                    </div>
                                    
                                    <div class="idea-tags">
                                        ${idea.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                                    </div>
                                </div>
                                <button class="create-ai-idea-btn" data-idea="${encodeURIComponent(JSON.stringify(idea))}">
                                    このアイデアを採用
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- AIシリーズ提案 -->
                <div class="ai-series-section">
                    <h3 class="subsection-title">📚 AI提案：シリーズ企画</h3>
                    <div class="ai-series-grid">
                        ${seriesIdeas.map(series => `
                            <div class="ai-series-card">
                                <div class="series-header">
                                    <span class="ai-icon">🤖</span>
                                    <h4 class="series-title">${series.seriesTitle}</h4>
                                </div>
                                <div class="series-details">
                                    <p class="series-description">${series.description}</p>
                                    <p class="series-schedule">全${series.episodeCount}回 - ${series.schedule}</p>
                                    <p class="expected-engagement"><strong>期待効果:</strong> ${series.expectedEngagement}</p>
                                    
                                    <div class="episode-preview">
                                        <h5>エピソード例:</h5>
                                        ${series.episodes.map(episode => `
                                            <div class="episode-item">
                                                <strong>${episode.title}</strong>
                                                <p>${episode.description}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <button class="create-ai-series-btn" data-series="${encodeURIComponent(JSON.stringify(series))}">
                                    シリーズを開始
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 最適化ティップス -->
                <div class="optimization-section">
                    <h3 class="subsection-title">⚡ AI最適化アドバイス</h3>
                    <div class="optimization-grid">
                        <div class="optimization-card">
                            <h4>⏰ 投稿タイミング</h4>
                            <p>${optimizationTips.bestUploadTime}</p>
                        </div>
                        
                        <div class="optimization-card">
                            <h4>📝 効果的なタイトル形式</h4>
                            <ul>
                                ${optimizationTips.titleFormats.map(format => `<li>${format}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="optimization-card">
                            <h4>🖼️ サムネイル提案</h4>
                            <ul>
                                ${optimizationTips.thumbnailSuggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="optimization-card">
                            <h4>📏 推奨動画時間</h4>
                            <p>${optimizationTips.videoLength}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateContentIdeasHTML(data) {
        const { viewerNeeds, patterns, videoIdeas } = data;

        return `
            <div class="content-ideas-section">
                <h2 class="section-title">🎯 次の動画アイデア</h2>
                
                <!-- カスタム動画アイデア生成 -->
                <div class="custom-idea-generation">
                    <h3 class="subsection-title">💡 カスタム動画アイデア生成</h3>
                    <div class="custom-idea-form">
                        <textarea id="customIdeaPrompt" placeholder="どんな動画を作りたいですか？例：「初心者向けのプログラミング解説動画」「料理の時短テクニック」など..." rows="3"></textarea>
                        <button id="generateCustomIdea" class="generate-btn">
                            <span class="btn-icon">🤖</span>
                            アイデアを生成
                        </button>
                    </div>
                    <div id="customIdeaResult" class="custom-idea-result"></div>
                </div>
                
                <!-- 今すぐ作れる動画 -->
                <div class="quick-ideas-section">
                    <h3 class="subsection-title">📹 今すぐ作れる動画（制作時間: 2-4時間）</h3>
                    <div class="ideas-grid">
                        ${videoIdeas.quickIdeas.map(idea => `
                            <div class="idea-card quick-idea">
                                <div class="idea-header">
                                    <span class="fire-icon">🔥</span>
                                    <h4 class="idea-title">${idea.title}</h4>
                                </div>
                                <div class="idea-details">
                                    <p class="idea-reason">理由: ${idea.reason}</p>
                                    <p class="idea-prediction">予想: 現在の平均×${idea.estimatedViews}の視聴</p>
                                    <div class="idea-meta">
                                        <span class="production-time">⏱️ ${idea.productionTime}</span>
                                        <span class="difficulty ${idea.difficulty}">🎯 ${idea.difficulty}</span>
                                    </div>
                                    <div class="idea-tags">
                                        ${idea.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                                    </div>
                                </div>
                                <button class="create-idea-btn" data-idea-type="quick" data-idea="${encodeURIComponent(JSON.stringify(idea))}">
                                    このアイデアを採用
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- シリーズ化提案 -->
                <div class="series-ideas-section">
                    <h3 class="subsection-title">📚 シリーズ化提案</h3>
                    <div class="series-grid">
                        ${videoIdeas.seriesIdeas.map(series => `
                            <div class="series-card">
                                <div class="series-header">
                                    <span class="chart-icon">📈</span>
                                    <h4 class="series-title">${series.seriesTitle}</h4>
                                </div>
                                <div class="series-details">
                                    <p class="series-description">${series.description}</p>
                                    <p class="series-schedule">全${series.episodeCount}回 - ${series.schedule}</p>
                                    <div class="episode-preview">
                                        <h5>エピソード例:</h5>
                                        <ul>
                                            ${series.episodes.map(episode => `<li>${episode}</li>`).join('')}
                                        </ul>
                                    </div>
                                </div>
                                <button class="create-series-btn" data-series="${encodeURIComponent(JSON.stringify(series))}">
                                    シリーズを開始
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- トレンド動画 -->
                <div class="trending-ideas-section">
                    <h3 class="subsection-title">🔥 トレンド動画（緊急度高）</h3>
                    <div class="trending-grid">
                        ${videoIdeas.trendingIdeas.map(trend => `
                            <div class="trending-card urgency-${trend.urgency}">
                                <div class="trending-header">
                                    <span class="trending-icon">⚡</span>
                                    <h4 class="trending-title">${trend.title}</h4>
                                    <span class="urgency-badge ${trend.urgency}">緊急度: ${trend.urgency}</span>
                                </div>
                                <p class="trending-reason">${trend.reason}</p>
                                <button class="create-trending-btn" data-trending="${encodeURIComponent(JSON.stringify(trend))}">
                                    今すぐ作成
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 視聴者ニーズ分析 -->
                <div class="viewer-needs-section">
                    <h3 class="subsection-title">👥 視聴者ニーズ分析</h3>
                    <div class="needs-grid">
                        ${viewerNeeds.viewerNeeds.map(need => `
                            <div class="need-card demand-${need.demand}">
                                <h4 class="need-topic">${need.topic}</h4>
                                <div class="need-details">
                                    <span class="demand-level ${need.demand}">需要: ${need.demand}</span>
                                    <span class="comment-count">📝 ${need.commentCount}件のコメント</span>
                                </div>
                                <p class="need-reasoning">${need.reasoning}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="keywords-section">
                        <h4>🔍 トレンドキーワード</h4>
                        <div class="keywords-list">
                            ${viewerNeeds.trendingKeywords.map(keyword => 
                                `<span class="keyword-tag">${keyword}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="gaps-section">
                        <h4>📊 コンテンツギャップ</h4>
                        <ul class="gaps-list">
                            ${viewerNeeds.contentGaps.map(gap => `<li>${gap}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                <!-- 成功パターン分析 -->
                <div class="patterns-section">
                    <h3 class="subsection-title">📈 成功パターン分析</h3>
                    <div class="patterns-grid">
                        ${patterns.patterns.map(pattern => `
                            <div class="pattern-card">
                                <h4 class="pattern-name">${pattern.pattern}</h4>
                                <p class="pattern-description">${pattern.description}</p>
                                <p class="success-factor"><strong>成功要因:</strong> ${pattern.successFactor}</p>
                                <div class="pattern-examples">
                                    <strong>例:</strong>
                                    ${pattern.examples.map(example => `<span class="example-tag">${example}</span>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="optimal-timing">
                        <h4>⏰ 最適投稿タイミング</h4>
                        <p><strong>曜日:</strong> ${patterns.optimalTiming.dayOfWeek}</p>
                        <p><strong>時間帯:</strong> ${patterns.optimalTiming.timeOfDay}</p>
                        <p><strong>動画時間:</strong> ${patterns.videoLength}</p>
                    </div>
                    
                    <div class="title-formats">
                        <h4>📝 効果的なタイトル形式</h4>
                        <ul>
                            ${patterns.titleFormats.map(format => `<li>${format}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // カスタムアイデア生成ボタン
        const generateBtn = document.getElementById('generateCustomIdea');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateCustomVideoIdea();
            });
        }

        // 通常のアイデア採用ボタン
        document.querySelectorAll('.create-idea-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ideaData = JSON.parse(decodeURIComponent(e.target.dataset.idea));
                this.handleIdeaSelection(ideaData, 'quick');
            });
        });

        // AIアイデア採用ボタン
        document.querySelectorAll('.create-ai-idea-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ideaData = JSON.parse(decodeURIComponent(e.target.dataset.idea));
                this.handleAIIdeaSelection(ideaData);
            });
        });

        // シリーズ開始ボタン
        document.querySelectorAll('.create-series-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const seriesData = JSON.parse(decodeURIComponent(e.target.dataset.series));
                this.handleSeriesSelection(seriesData);
            });
        });

        // AIシリーズ開始ボタン
        document.querySelectorAll('.create-ai-series-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const seriesData = JSON.parse(decodeURIComponent(e.target.dataset.series));
                this.handleAISeriesSelection(seriesData);
            });
        });

        // トレンド動画作成ボタン
        document.querySelectorAll('.create-trending-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const trendingData = JSON.parse(decodeURIComponent(e.target.dataset.trending));
                this.handleTrendingSelection(trendingData);
            });
        });
    }

    handleIdeaSelection(idea, type) {
        console.log('Idea selected:', idea);
        
        // アイデア選択後の処理
        const modal = this.createIdeaModal(idea, type);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    handleSeriesSelection(series) {
        console.log('Series selected:', series);
        
        // シリーズ選択後の処理
        const modal = this.createSeriesModal(series);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    handleAIIdeaSelection(idea) {
        console.log('AI Idea selected:', idea);
        
        // AIアイデア選択後の処理
        const modal = this.createAIIdeaModal(idea);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    handleAISeriesSelection(series) {
        console.log('AI Series selected:', series);
        
        // AIシリーズ選択後の処理
        const modal = this.createAISeriesModal(series);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    handleTrendingSelection(trending) {
        console.log('Trending idea selected:', trending);
        
        // トレンド動画選択後の処理
        const modal = this.createTrendingModal(trending);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    createIdeaModal(idea, type) {
        const modal = document.createElement('div');
        modal.className = 'idea-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>📹 動画アイデア詳細</h3>
                <div class="modal-details">
                    <h4>${idea.title}</h4>
                    <p><strong>理由:</strong> ${idea.reason}</p>
                    <p><strong>予想視聴数:</strong> 現在の平均×${idea.estimatedViews}</p>
                    <p><strong>制作時間:</strong> ${idea.productionTime}</p>
                    <p><strong>難易度:</strong> ${idea.difficulty}</p>
                    
                    <div class="modal-actions">
                        <textarea placeholder="追加メモやアイデア..." rows="4"></textarea>
                        <div class="modal-buttons">
                            <button class="btn-primary">制作リストに追加</button>
                            <button class="btn-secondary">後で検討</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').onclick = () => {
            modal.remove();
        };

        return modal;
    }

    createSeriesModal(series) {
        const modal = document.createElement('div');
        modal.className = 'series-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>📚 シリーズ企画詳細</h3>
                <div class="modal-details">
                    <h4>${series.seriesTitle}</h4>
                    <p><strong>説明:</strong> ${series.description}</p>
                    <p><strong>エピソード数:</strong> 全${series.episodeCount}回</p>
                    <p><strong>更新スケジュール:</strong> ${series.schedule}</p>
                    
                    <h5>エピソード一覧:</h5>
                    <ul>
                        ${series.episodes.map(episode => `<li>${episode}</li>`).join('')}
                    </ul>
                    
                    <div class="modal-actions">
                        <textarea placeholder="シリーズ企画への追加アイデア..." rows="4"></textarea>
                        <div class="modal-buttons">
                            <button class="btn-primary">シリーズ開始</button>
                            <button class="btn-secondary">企画を保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').onclick = () => {
            modal.remove();
        };

        return modal;
    }

    createTrendingModal(trending) {
        const modal = document.createElement('div');
        modal.className = 'trending-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>🔥 トレンド動画詳細</h3>
                <div class="modal-details">
                    <h4>${trending.title}</h4>
                    <p><strong>緊急度:</strong> <span class="urgency-${trending.urgency}">${trending.urgency}</span></p>
                    <p><strong>理由:</strong> ${trending.reason}</p>
                    
                    <div class="trending-warning">
                        <strong>⚠️ 注意:</strong> トレンド動画は時期を逃すと効果が下がります。早めの制作をお勧めします。
                    </div>
                    
                    <div class="modal-actions">
                        <textarea placeholder="トレンドに関する追加情報..." rows="3"></textarea>
                        <div class="modal-buttons">
                            <button class="btn-urgent">今すぐ制作開始</button>
                            <button class="btn-secondary">リマインダー設定</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').onclick = () => {
            modal.remove();
        };

        return modal;
    }

    createAIIdeaModal(idea) {
        const modal = document.createElement('div');
        modal.className = 'ai-idea-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>🤖 AI提案動画アイデア詳細</h3>
                <div class="modal-details">
                    <h4>${idea.title}</h4>
                    <p><strong>提案理由:</strong> ${idea.reason}</p>
                    <p><strong>予想視聴数:</strong> 現在の平均×${idea.estimatedViews}</p>
                    <p><strong>制作時間:</strong> ${idea.productionTime}</p>
                    <p><strong>難易度:</strong> ${idea.difficulty}</p>
                    <p><strong>ターゲット視聴者:</strong> ${idea.targetAudience}</p>
                    
                    <div class="key-points-modal">
                        <h5>📝 重要ポイント:</h5>
                        <ul>
                            ${idea.keyPoints.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="modal-actions">
                        <textarea placeholder="AIアイデアへの追加メモやカスタマイズ..." rows="4"></textarea>
                        <div class="modal-buttons">
                            <button class="btn-primary">制作リストに追加</button>
                            <button class="btn-secondary">アイデアを保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').onclick = () => {
            modal.remove();
        };

        return modal;
    }

    createAISeriesModal(series) {
        const modal = document.createElement('div');
        modal.className = 'ai-series-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>🤖 AI提案シリーズ企画詳細</h3>
                <div class="modal-details">
                    <h4>${series.seriesTitle}</h4>
                    <p><strong>説明:</strong> ${series.description}</p>
                    <p><strong>エピソード数:</strong> 全${series.episodeCount}回</p>
                    <p><strong>更新スケジュール:</strong> ${series.schedule}</p>
                    <p><strong>期待効果:</strong> ${series.expectedEngagement}</p>
                    
                    <h5>エピソード詳細:</h5>
                    <div class="episodes-detail">
                        ${series.episodes.map(episode => `
                            <div class="episode-detail">
                                <strong>${episode.title}</strong>
                                <p>${episode.description}</p>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="modal-actions">
                        <textarea placeholder="シリーズ企画への追加アイデアや修正案..." rows="4"></textarea>
                        <div class="modal-buttons">
                            <button class="btn-primary">シリーズ制作開始</button>
                            <button class="btn-secondary">企画を保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').onclick = () => {
            modal.remove();
        };

        return modal;
    }

    showLoadingState() {
        const container = document.getElementById('content-ideas-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>🤖 AI が動画アイデアを生成しています...</p>
                    <small>コメント分析とトレンド分析を実行中</small>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('content-ideas-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <p class="error-message">❌ ${message}</p>
                    <button onclick="window.contentIdeaManager.retry()" class="retry-btn">再試行</button>
                </div>
            `;
        }
    }

    async generateCustomVideoIdea() {
        const promptInput = document.getElementById('customIdeaPrompt');
        const resultContainer = document.getElementById('customIdeaResult');
        const generateBtn = document.getElementById('generateCustomIdea');
        
        if (!promptInput || !promptInput.value.trim()) {
            alert('動画のアイデアについて入力してください');
            return;
        }

        const userPrompt = promptInput.value.trim();
        
        // ボタンを無効化してローディング状態に
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="loading-spinner-small"></span> 生成中...';
        resultContainer.innerHTML = '<div class="generating-message">🤖 Gemini AIがアイデアを生成しています...</div>';

        try {
            const response = await fetch('/api/generate-custom-video-idea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: userPrompt,
                    channelContext: this.currentData // 現在のチャンネルデータがあれば送信
                })
            });

            const result = await response.json();

            if (result.success) {
                this.renderCustomIdeaResult(result.data);
            } else {
                resultContainer.innerHTML = `<div class="error-message">❌ ${result.error || 'アイデア生成に失敗しました'}</div>`;
            }
        } catch (error) {
            console.error('Custom idea generation error:', error);
            resultContainer.innerHTML = '<div class="error-message">❌ ネットワークエラーが発生しました</div>';
        } finally {
            // ボタンを元に戻す
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="btn-icon">🤖</span> アイデアを生成';
        }
    }

    renderCustomIdeaResult(ideaData) {
        const resultContainer = document.getElementById('customIdeaResult');
        
        resultContainer.innerHTML = `
            <div class="custom-idea-card">
                <div class="custom-idea-header">
                    <span class="ai-badge">🤖 Gemini AI生成</span>
                    <h4 class="custom-idea-title">${ideaData.title}</h4>
                </div>
                <div class="custom-idea-content">
                    <div class="idea-section">
                        <h5>📝 コンセプト</h5>
                        <p>${ideaData.concept}</p>
                    </div>
                    
                    <div class="idea-section">
                        <h5>🎯 ターゲット視聴者</h5>
                        <p>${ideaData.targetAudience}</p>
                    </div>
                    
                    <div class="idea-section">
                        <h5>📋 動画の構成</h5>
                        <ul class="structure-list">
                            ${ideaData.structure.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="idea-section">
                        <h5>💡 成功のポイント</h5>
                        <ul class="key-points-list">
                            ${ideaData.keyPoints.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="idea-meta">
                        <span class="meta-item">⏱️ 制作時間: ${ideaData.estimatedTime}</span>
                        <span class="meta-item">📊 難易度: ${ideaData.difficulty}</span>
                        <span class="meta-item">👁️ 予想視聴数: ${ideaData.estimatedViews}</span>
                    </div>
                    
                    <div class="idea-tags">
                        ${ideaData.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                    </div>
                    
                    <div class="idea-actions">
                        <button class="save-custom-idea-btn" data-idea="${encodeURIComponent(JSON.stringify(ideaData))}">
                            💾 このアイデアを保存
                        </button>
                        <button class="regenerate-btn" onclick="document.getElementById('generateCustomIdea').click()">
                            🔄 別のアイデアを生成
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 保存ボタンのイベントリスナーを追加
        const saveBtn = resultContainer.querySelector('.save-custom-idea-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                const ideaData = JSON.parse(decodeURIComponent(e.target.dataset.idea));
                this.handleCustomIdeaSave(ideaData);
            });
        }
    }

    handleCustomIdeaSave(ideaData) {
        // カスタムアイデア保存のモーダル表示
        const modal = this.createCustomIdeaSaveModal(ideaData);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    createCustomIdeaSaveModal(idea) {
        const modal = document.createElement('div');
        modal.className = 'custom-idea-save-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>💾 カスタムアイデアを保存</h3>
                <div class="modal-details">
                    <h4>${idea.title}</h4>
                    <div class="save-options">
                        <label>
                            <input type="checkbox" id="addToProductionList" checked>
                            制作リストに追加
                        </label>
                        <label>
                            <input type="checkbox" id="saveForLater">
                            後で検討リストに保存
                        </label>
                    </div>
                    <textarea placeholder="追加のメモやアイデア..." rows="3"></textarea>
                    <div class="modal-buttons">
                        <button class="btn-primary save-confirm">保存</button>
                        <button class="btn-secondary">キャンセル</button>
                    </div>
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').onclick = () => {
            modal.remove();
        };

        modal.querySelector('.btn-secondary').onclick = () => {
            modal.remove();
        };

        modal.querySelector('.save-confirm').onclick = () => {
            // 保存処理（実際の実装では、バックエンドに送信など）
            alert('アイデアを保存しました！');
            modal.remove();
        };

        return modal;
    }

    retry() {
        if (this.lastChannelId) {
            this.generateContentIdeas(this.lastChannelId);
        }
    }

    clear() {
        const container = document.getElementById('content-ideas-container');
        if (container) {
            container.innerHTML = '';
        }
        this.currentData = null;
    }
}