/**
 * Event bus for decoupled component communication
 */
export class EventBus {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }

    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
}

// Global event bus instance
export const eventBus = new EventBus();

// Event constants
export const Events = {
    // Channel events
    CHANNEL_ANALYZED: 'channel:analyzed',
    CHANNEL_ERROR: 'channel:error',
    
    // Video events
    VIDEO_SELECTED: 'video:selected',
    VIDEO_ANALYSIS_COMPLETE: 'video:analysis:complete',
    
    // Comment events
    COMMENTS_LOADED: 'comments:loaded',
    COMMENT_ANALYSIS_COMPLETE: 'comments:analysis:complete',
    
    // Content idea events
    IDEAS_GENERATED: 'ideas:generated',
    IDEA_SELECTED: 'idea:selected',
    
    // UI events
    LOADING_START: 'ui:loading:start',
    LOADING_END: 'ui:loading:end',
    ERROR_OCCURRED: 'ui:error',
    SECTION_CHANGED: 'ui:section:changed',
    
    // Data events
    DATA_UPDATED: 'data:updated',
    DATA_CLEARED: 'data:cleared'
};