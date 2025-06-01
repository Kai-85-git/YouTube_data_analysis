/**
 * Base class for all UI components
 */
export class BaseComponent {
    constructor(container) {
        this.container = container;
        this.isLoading = false;
        this.currentData = null;
        this.mounted = false;
    }

    mount() {
        this.mounted = true;
        this.onMount();
    }

    unmount() {
        this.mounted = false;
        this.onUnmount();
    }

    onMount() {}
    onUnmount() {}

    showLoadingState(message = '読み込み中...') {
        this.isLoading = true;
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    showError(message) {
        this.isLoading = false;
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <p class="error-message">${message}</p>
                </div>
            `;
        }
    }

    showEmpty(message = 'データがありません') {
        this.isLoading = false;
        if (this.container) {
            this.container.innerHTML = `
                <div class="empty-container">
                    <p class="empty-message">${message}</p>
                </div>
            `;
        }
    }

    render(data) {
        this.currentData = data;
        this.isLoading = false;
        // Override in subclasses
    }

    attachEventListeners(selector, event, handler, options = {}) {
        const elements = this.container?.querySelectorAll(selector) || [];
        elements.forEach(element => {
            element.addEventListener(event, handler.bind(this), options);
        });
    }

    createElement(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    updateElement(selector, content) {
        const element = this.container?.querySelector(selector);
        if (element) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.textContent = content;
            }
        }
    }

    toggleVisibility(selector, show) {
        const element = this.container?.querySelector(selector) || document.querySelector(selector);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
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

    formatDate(dateString, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('ja-JP', { ...defaultOptions, ...options });
    }
}