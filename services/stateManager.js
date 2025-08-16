/**
 * StateManager - Centralized state management for GrocerEase UI
 * Manages application state, persistence, and state change notifications
 */

class StateManager {
  constructor() {
    this.state = this.getInitialState();
    this.subscribers = [];
    this.persistentKeys = ['user', 'shoppingList', 'preferences', 'searchHistory'];
    this.debounceTimers = {};
    
    // Restore state from localStorage
    this.restoreState();
    
    // Set up persistence
    this.setupPersistence();
  }

  /**
   * Get initial application state
   * @returns {Object} Initial state structure
   */
  getInitialState() {
    return {
      // Search State
      search: {
        query: '',
        results: [],
        filters: {
          location: { lat: null, lon: null, radius: 5 },
          price: { min: null, max: null },
          categories: [],
          sortBy: 'relevance'
        },
        loading: false,
        error: null,
        lastSearch: null,
        suggestions: []
      },
      
      // Chat State
      chat: {
        messages: [],
        currentUser: null,
        sessionId: null,
        loading: false,
        error: null,
        unreadCount: 0
      },
      
      // Shopping List State
      shoppingList: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        lastUpdated: null,
        syncedWithChat: false,
        categories: {}
      },
      
      // User State
      user: {
        id: null,
        location: null,
        selectedStore: null,
        preferences: {},
        searchHistory: [],
        lastActive: null
      },
      
      // Integration State
      integration: {
        chatServiceConnected: false,
        searchServiceConnected: false,
        lastSync: null,
        errors: [],
        status: 'disconnected'
      },
      
      // UI State
      ui: {
        currentTab: 'home',
        modals: {
          search: false,
          chat: false,
          settings: false,
          productDetail: false
        },
        notifications: [],
        loading: false
      }
    };
  }

  /**
   * Update state at specific path
   * @param {string|Array} path - State path (e.g., 'search.query' or ['search', 'query'])
   * @param {*} value - New value
   * @param {Object} options - Update options
   */
  updateState(path, value, options = {}) {
    const pathArray = Array.isArray(path) ? path : path.split('.');
    const currentState = { ...this.state };
    
    // Navigate to the nested path
    let current = currentState;
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Set the value
    const lastKey = pathArray[pathArray.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;
    
    // Notify subscribers
    this.notifySubscribers(pathArray, value, oldValue, options);
    
    // Persist if needed
    if (options.persist !== false) {
      this.debouncedPersist();
    }
  }

  /**
   * Get state value at specific path
   * @param {string|Array} path - State path
   * @returns {*} State value
   */
  getState(path = null) {
    if (!path) return this.state;
    
    const pathArray = Array.isArray(path) ? path : path.split('.');
    let current = this.state;
    
    for (const key of pathArray) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   * @param {string|Array} path - Optional path filter
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback, path = null) {
    const subscriber = { callback, path: path ? (Array.isArray(path) ? path : path.split('.')) : null };
    this.subscribers.push(subscriber);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify subscribers of state changes
   * @param {Array} path - Changed path
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   * @param {Object} options - Update options
   */
  notifySubscribers(path, newValue, oldValue, options) {
    this.subscribers.forEach(subscriber => {
      // Check if subscriber is interested in this path
      if (!subscriber.path || this.pathMatches(path, subscriber.path)) {
        try {
          subscriber.callback({
            path,
            newValue,
            oldValue,
            options,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('StateManager subscriber error:', error);
        }
      }
    });
  }

  /**
   * Check if path matches subscriber filter
   * @param {Array} changePath - Path that changed
   * @param {Array} subscriberPath - Subscriber's path filter
   * @returns {boolean} Whether paths match
   */
  pathMatches(changePath, subscriberPath) {
    if (subscriberPath.length > changePath.length) return false;
    
    for (let i = 0; i < subscriberPath.length; i++) {
      if (subscriberPath[i] !== changePath[i]) return false;
    }
    
    return true;
  }

  /**
   * Set up automatic state persistence
   */
  setupPersistence() {
    // Persist state on page unload
    window.addEventListener('beforeunload', () => {
      this.persistState();
    });
    
    // Persist state periodically
    setInterval(() => {
      this.persistState();
    }, 30000); // Every 30 seconds
  }

  /**
   * Persist state to localStorage
   */
  persistState() {
    try {
      const persistentData = {};
      
      this.persistentKeys.forEach(key => {
        if (this.state[key]) {
          persistentData[key] = this.state[key];
        }
      });
      
      localStorage.setItem('grocerEaseState', JSON.stringify(persistentData));
    } catch (error) {
      console.error('StateManager persist error:', error);
    }
  }

  /**
   * Restore state from localStorage
   */
  restoreState() {
    try {
      const savedState = localStorage.getItem('grocerEaseState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        this.persistentKeys.forEach(key => {
          if (parsedState[key]) {
            this.state[key] = { ...this.state[key], ...parsedState[key] };
          }
        });
        
        console.log('State restored from localStorage');
      }
    } catch (error) {
      console.error('StateManager restore error:', error);
    }
  }

  /**
   * Debounced persistence to avoid excessive localStorage writes
   */
  debouncedPersist() {
    if (this.debounceTimers.persist) {
      clearTimeout(this.debounceTimers.persist);
    }
    
    this.debounceTimers.persist = setTimeout(() => {
      this.persistState();
    }, 1000);
  }

  /**
   * Clear all state
   */
  clearState() {
    this.state = this.getInitialState();
    this.notifySubscribers(['*'], null, null, { clear: true });
    localStorage.removeItem('grocerEaseState');
  }

  /**
   * Reset specific state section
   * @param {string} section - State section to reset
   */
  resetSection(section) {
    if (this.state[section]) {
      const oldValue = this.state[section];
      this.state[section] = this.getInitialState()[section];
      this.notifySubscribers([section], this.state[section], oldValue, { reset: true });
      this.debouncedPersist();
    }
  }

  /**
   * Batch update multiple state values
   * @param {Object} updates - Object with path-value pairs
   * @param {Object} options - Update options
   */
  batchUpdate(updates, options = {}) {
    const oldValues = {};
    
    // Collect old values
    Object.keys(updates).forEach(path => {
      oldValues[path] = this.getState(path);
    });
    
    // Apply updates
    Object.entries(updates).forEach(([path, value]) => {
      this.updateState(path, value, { ...options, persist: false });
    });
    
    // Persist once after batch update
    if (options.persist !== false) {
      this.debouncedPersist();
    }
    
    // Notify batch update
    this.notifySubscribers(['batch'], updates, oldValues, { ...options, batch: true });
  }

  /**
   * Get state snapshot for debugging
   * @returns {Object} State snapshot
   */
  getSnapshot() {
    return {
      state: JSON.parse(JSON.stringify(this.state)),
      subscribers: this.subscribers.length,
      timestamp: Date.now()
    };
  }

  /**
   * Validate state structure
   * @returns {boolean} Whether state is valid
   */
  validateState() {
    try {
      // Check if all required sections exist
      const requiredSections = ['search', 'chat', 'shoppingList', 'user', 'integration', 'ui'];
      const hasAllSections = requiredSections.every(section => 
        this.state[section] && typeof this.state[section] === 'object'
      );
      
      if (!hasAllSections) {
        console.error('StateManager: Missing required sections');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('StateManager validation error:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateManager;
} 