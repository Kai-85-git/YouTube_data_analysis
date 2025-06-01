import { eventBus, Events } from './event-bus.js';

/**
 * Centralized application state management
 */
export class AppState {
    constructor() {
        this.state = {
            channel: null,
            videos: [],
            comments: [],
            commentAnalysis: null,
            performanceAnalysis: null,
            contentIdeas: [],
            currentSection: 'channelInfo',
            isLoading: false,
            error: null
        };
        
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 10;
    }

    // Get current state
    getState() {
        return { ...this.state };
    }

    // Get specific state value
    get(key) {
        return this.state[key];
    }

    // Update state
    update(updates) {
        const oldState = { ...this.state };
        
        // Update state
        Object.assign(this.state, updates);
        
        // Save to history
        this.saveToHistory(oldState);
        
        // Notify listeners
        this.notifyListeners(updates);
        
        // Emit events
        this.emitStateChangeEvents(updates);
        
        // Save to localStorage if caching is enabled
        this.saveToCache();
    }

    // Subscribe to state changes
    subscribe(callback) {
        const id = Symbol();
        this.listeners.set(id, callback);
        
        // Return unsubscribe function
        return () => this.listeners.delete(id);
    }

    // Subscribe to specific key changes
    watch(key, callback) {
        const wrapper = (state) => {
            if (key in state) {
                callback(state[key], this.state[key]);
            }
        };
        return this.subscribe(wrapper);
    }

    // Clear state
    clear() {
        this.update({
            channel: null,
            videos: [],
            comments: [],
            commentAnalysis: null,
            performanceAnalysis: null,
            contentIdeas: [],
            error: null
        });
        eventBus.emit(Events.DATA_CLEARED);
    }

    // Private methods
    notifyListeners(updates) {
        this.listeners.forEach(callback => {
            try {
                callback(updates, this.state);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    emitStateChangeEvents(updates) {
        eventBus.emit(Events.DATA_UPDATED, updates);
        
        // Emit specific events based on updates
        if ('channel' in updates && updates.channel) {
            eventBus.emit(Events.CHANNEL_ANALYZED, updates.channel);
        }
        
        if ('comments' in updates && updates.comments.length > 0) {
            eventBus.emit(Events.COMMENTS_LOADED, updates.comments);
        }
        
        if ('contentIdeas' in updates && updates.contentIdeas.length > 0) {
            eventBus.emit(Events.IDEAS_GENERATED, updates.contentIdeas);
        }
        
        if ('error' in updates && updates.error) {
            eventBus.emit(Events.ERROR_OCCURRED, updates.error);
        }
        
        if ('currentSection' in updates) {
            eventBus.emit(Events.SECTION_CHANGED, updates.currentSection);
        }
    }

    saveToHistory(oldState) {
        this.history.push({
            state: oldState,
            timestamp: Date.now()
        });
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    saveToCache() {
        try {
            const cacheData = {
                state: this.state,
                timestamp: Date.now()
            };
            localStorage.setItem('appState', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save state to cache:', error);
        }
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem('appState');
            if (cached) {
                const { state, timestamp } = JSON.parse(cached);
                const age = Date.now() - timestamp;
                
                // Check if cache is still valid (1 hour)
                if (age < 3600000) {
                    this.state = state;
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load state from cache:', error);
        }
        return false;
    }

    // Computed getters
    get hasChannel() {
        return !!this.state.channel;
    }

    get hasAnalysis() {
        return !!this.state.commentAnalysis || !!this.state.performanceAnalysis;
    }

    get totalVideos() {
        return this.state.videos.length;
    }

    get totalComments() {
        return this.state.comments.length;
    }
}

// Singleton instance
export const appState = new AppState();