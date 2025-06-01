/**
 * Unified modal management utility
 */
export class ModalManager {
    static activeModals = new Set();
    static modalContainer = null;

    static init() {
        // Create modal container if it doesn't exist
        if (!this.modalContainer) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.id = 'modalContainer';
            document.body.appendChild(this.modalContainer);
        }

        // Add global escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.size > 0) {
                const lastModal = Array.from(this.activeModals).pop();
                this.close(lastModal);
            }
        });
    }

    static create(config) {
        const {
            title = '',
            content = '',
            actions = [],
            className = '',
            closeOnOverlay = true,
            onClose = null
        } = config;

        // Create modal structure
        const modal = document.createElement('div');
        modal.className = `modal ${className}`;
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                ${title ? `<div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" aria-label="閉じる">&times;</button>
                </div>` : ''}
                <div class="modal-body">
                    ${content}
                </div>
                ${actions.length > 0 ? `<div class="modal-footer">
                    ${actions.map(action => `
                        <button class="btn ${action.className || ''}" 
                                data-action="${action.id || ''}">
                            ${action.label}
                        </button>
                    `).join('')}
                </div>` : ''}
            </div>
        `;

        // Store config for later reference
        modal._config = { closeOnOverlay, onClose };

        // Attach event listeners
        this.attachModalEvents(modal, actions);

        return modal;
    }

    static show(modal) {
        if (!this.modalContainer) {
            this.init();
        }

        // Add to container and track
        this.modalContainer.appendChild(modal);
        this.activeModals.add(modal);

        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('modal-open');
        });

        // Prevent body scroll
        if (this.activeModals.size === 1) {
            document.body.style.overflow = 'hidden';
        }

        return modal;
    }

    static close(modal) {
        if (!modal || !this.activeModals.has(modal)) return;

        // Call onClose callback if provided
        if (modal._config?.onClose) {
            modal._config.onClose();
        }

        // Remove from tracking
        this.activeModals.delete(modal);

        // Trigger close animation
        modal.classList.remove('modal-open');
        modal.classList.add('modal-closing');

        // Remove after animation
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);

        // Restore body scroll if no more modals
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }
    }

    static closeAll() {
        this.activeModals.forEach(modal => this.close(modal));
    }

    static update(modal, updates) {
        if (!modal) return;

        if (updates.title) {
            const titleEl = modal.querySelector('.modal-title');
            if (titleEl) titleEl.textContent = updates.title;
        }

        if (updates.content) {
            const bodyEl = modal.querySelector('.modal-body');
            if (bodyEl) bodyEl.innerHTML = updates.content;
        }

        if (updates.actions) {
            const footerEl = modal.querySelector('.modal-footer');
            if (footerEl) {
                footerEl.innerHTML = updates.actions.map(action => `
                    <button class="btn ${action.className || ''}" 
                            data-action="${action.id || ''}">
                        ${action.label}
                    </button>
                `).join('');
                this.attachActionHandlers(modal, updates.actions);
            }
        }
    }

    static attachModalEvents(modal, actions) {
        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close(modal));
        }

        // Overlay click
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay && modal._config?.closeOnOverlay) {
            overlay.addEventListener('click', () => this.close(modal));
        }

        // Action buttons
        this.attachActionHandlers(modal, actions);
    }

    static attachActionHandlers(modal, actions) {
        actions.forEach(action => {
            const btn = modal.querySelector(`[data-action="${action.id}"]`);
            if (btn && action.handler) {
                btn.addEventListener('click', (e) => {
                    const result = action.handler(e, modal);
                    if (result !== false && action.closeOnClick !== false) {
                        this.close(modal);
                    }
                });
            }
        });
    }

    // Utility methods for common modal types
    static alert(message, title = '通知') {
        const modal = this.create({
            title,
            content: `<p>${message}</p>`,
            actions: [{
                id: 'ok',
                label: 'OK',
                className: 'btn-primary'
            }]
        });
        return this.show(modal);
    }

    static confirm(message, title = '確認') {
        return new Promise((resolve) => {
            const modal = this.create({
                title,
                content: `<p>${message}</p>`,
                actions: [
                    {
                        id: 'cancel',
                        label: 'キャンセル',
                        handler: () => resolve(false)
                    },
                    {
                        id: 'confirm',
                        label: '確認',
                        className: 'btn-primary',
                        handler: () => resolve(true)
                    }
                ]
            });
            this.show(modal);
        });
    }

    static loading(message = '処理中...') {
        const modal = this.create({
            content: `
                <div class="loading-modal">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `,
            closeOnOverlay: false,
            className: 'modal-loading'
        });
        return this.show(modal);
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ModalManager.init());
} else {
    ModalManager.init();
}