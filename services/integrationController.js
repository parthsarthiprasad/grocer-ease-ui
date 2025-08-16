/**
 * IntegrationController - Main orchestrator for GrocerEase integration
 * Manages communication between chat service, search service, and UI
 */

class IntegrationController {
  constructor() {
    // Initialize services
    this.stateManager = new StateManager();
    this.searchService = new SearchService();
    this.chatService = new ChatService();
    this.locationService = new LocationService();
    this.shoppingListSync = new ShoppingListSync(this.chatService, this.stateManager);
    
    // Integration state
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Initialize integration
    this.init();
  }

  /**
   * Initialize the integration controller
   */
  async init() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform actual initialization
   */
  async _performInitialization() {
    try {
      console.log('Initializing GrocerEase Integration Controller...');
      
      // Test service connections
      await this.testServiceConnections();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize user session
      await this.initializeUserSession();
      
      // Set up automatic sync
      this.setupAutomaticSync();
      
      this.isInitialized = true;
      console.log('Integration Controller initialized successfully');
      
      // Update integration status
      this.stateManager.updateState('integration.status', 'connected');
      
    } catch (error) {
      console.error('Integration Controller initialization failed:', error);
      this.stateManager.updateState('integration.status', 'error');
      throw error;
    }
  }

  /**
   * Test connections to all services
   */
  async testServiceConnections() {
    const results = {
      searchService: false,
      chatService: false
    };

    try {
      // Test search service
      results.searchService = await this.searchService.testConnection();
      this.stateManager.updateState('integration.searchServiceConnected', results.searchService);
      
      if (results.searchService) {
        console.log('Search service connection successful');
      } else {
        console.warn('Search service connection failed');
      }
    } catch (error) {
      console.error('Search service connection test error:', error);
    }

    try {
      // Test chat service
      results.chatService = await this.chatService.testConnection();
      this.stateManager.updateState('integration.chatServiceConnected', results.chatService);
      
      if (results.chatService) {
        console.log('Chat service connection successful');
      } else {
        console.warn('Chat service connection failed');
      }
    } catch (error) {
      console.error('Chat service connection test error:', error);
    }

    return results;
  }

  /**
   * Set up event listeners for integration
   */
  setupEventListeners() {
    // Listen for search queries from chat
    this.stateManager.subscribe(this.handleChatSearchIntent.bind(this), 'chat.messages');
    
    // Listen for shopping list changes
    this.stateManager.subscribe(this.handleShoppingListChange.bind(this), 'shoppingList.items');
    
    // Listen for location changes
    this.stateManager.subscribe(this.handleLocationChange.bind(this), 'user.location');
    
    console.log('Integration event listeners set up');
  }

  /**
   * Initialize user session
   */
  async initializeUserSession() {
    try {
      // Generate or restore user ID
      const userId = this.chatService.getCurrentUserId();
      this.stateManager.updateState('user.id', userId);
      
      // Get user preferences from chat service
      const preferences = await this.chatService.getUserPreferences(userId);
      this.stateManager.updateState('user.preferences', preferences);
      
      // Get user location
      const locationStatus = this.locationService.getLocationStatus();
      if (locationStatus.hasLocation) {
        this.stateManager.updateState('user.location', locationStatus.searchLocation);
      }
      
      console.log('User session initialized:', userId);
    } catch (error) {
      console.error('User session initialization failed:', error);
    }
  }

  /**
   * Set up automatic synchronization
   */
  setupAutomaticSync() {
    // Start shopping list sync
    this.shoppingListSync.startPeriodicSync();
    
    // Set up periodic service health checks
    setInterval(() => {
      this.testServiceConnections();
    }, 60000); // Every minute
    
    console.log('Automatic sync and health checks set up');
  }

  /**
   * Handle chat messages with search intent
   * @param {Object} change - State change object
   */
  async handleChatSearchIntent(change) {
    if (!change.newValue || !Array.isArray(change.newValue)) return;
    
    const lastMessage = change.newValue[change.newValue.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;
    
    // Check if the message contains search intent
    if (lastMessage.searchIntent && lastMessage.searchIntent.type === 'product_search') {
      console.log('Search intent detected in chat:', lastMessage.searchIntent);
      
      // Trigger product search
      await this.performProductSearch(lastMessage.searchIntent);
    }
  }

  /**
   * Perform product search based on intent
   * @param {Object} searchIntent - Search intent object
   */
  async performProductSearch(searchIntent) {
    try {
      this.stateManager.updateState('search.loading', true);
      this.stateManager.updateState('search.query', searchIntent.query);
      
      // Get current search location
      const location = this.locationService.getSearchLocation();
      
      // Prepare search parameters
      const searchParams = {
        query: searchIntent.query,
        lat: location.lat,
        lon: location.lon,
        radius_km: location.radius,
        max_results: 20,
        categories: searchIntent.categories
      };
      
      // Perform search
      const results = await this.searchService.searchProducts(searchParams);
      
      // Update search state
      this.stateManager.batchUpdate({
        'search.results': results,
        'search.loading': false,
        'search.lastSearch': Date.now(),
        'search.error': null
      });
      
      // Add to search history
      this.addToSearchHistory(searchIntent.query, results.length);
      
      console.log(`Product search completed: ${results.length} results for "${searchIntent.query}"`);
      
    } catch (error) {
      console.error('Product search failed:', error);
      
      this.stateManager.batchUpdate({
        'search.loading': false,
        'search.error': error.message,
        'search.results': []
      });
    }
  }

  /**
   * Handle shopping list changes
   * @param {Object} change - State change object
   */
  handleShoppingListChange(change) {
    if (change.newValue && Array.isArray(change.newValue)) {
      // Update shopping list totals
      this.updateShoppingListTotals(change.newValue);
      
      // Trigger sync with chat service
      setTimeout(() => {
        this.shoppingListSync.syncWithChat();
      }, 1000);
    }
  }

  /**
   * Handle location changes
   * @param {Object} change - State change object
   */
  handleLocationChange(change) {
    if (change.newValue) {
      console.log('Location changed, updating search context');
      
      // Update search filters with new location
      this.stateManager.updateState('search.filters.location', {
        lat: change.newValue.lat,
        lon: change.newValue.lon,
        radius: change.newValue.radius
      });
      
      // If there's an active search, re-run it with new location
      const currentQuery = this.stateManager.getState('search.query');
      if (currentQuery) {
        setTimeout(() => {
          this.performProductSearch({
            type: 'product_search',
            query: currentQuery,
            confidence: 1.0,
            categories: []
          });
        }, 1000);
      }
    }
  }

  /**
   * Add search query to history
   * @param {string} query - Search query
   * @param {number} resultCount - Number of results
   */
  addToSearchHistory(query, resultCount) {
    const history = this.stateManager.getState('user.searchHistory') || [];
    const newEntry = {
      query: query,
      resultCount: resultCount,
      timestamp: Date.now(),
      location: this.locationService.getSearchLocation()
    };
    
    // Add to beginning of history
    const updatedHistory = [newEntry, ...history.slice(0, 9)]; // Keep last 10 searches
    
    this.stateManager.updateState('user.searchHistory', updatedHistory);
  }

  /**
   * Update shopping list totals
   * @param {Array} items - Shopping list items
   */
  updateShoppingListTotals(items) {
    const totalItems = items.length;
    const totalPrice = items.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    this.stateManager.batchUpdate({
      'shoppingList.totalItems': totalItems,
      'shoppingList.totalPrice': totalPrice,
      'shoppingList.lastUpdated': Date.now()
    });
  }

  /**
   * Process user message through chat service
   * @param {string} message - User message
   * @returns {Promise<Object>} Chat response
   */
  async processUserMessage(message) {
    try {
      this.stateManager.updateState('chat.loading', true);
      
      // Send message to chat service
      const response = await this.chatService.sendMessage(message);
      
      // Add message to chat state
      const currentMessages = this.stateManager.getState('chat.messages') || [];
      const newMessage = {
        id: response.messageId,
        role: 'user',
        content: message,
        timestamp: response.timestamp
      };
      
      const botMessage = {
        id: `bot_${response.messageId}`,
        role: 'assistant',
        content: response.bot_response,
        timestamp: response.timestamp,
        searchIntent: response.searchIntent
      };
      
      this.stateManager.batchUpdate({
        'chat.messages': [...currentMessages, newMessage, botMessage],
        'chat.loading': false,
        'chat.lastMessage': response.timestamp
      });
      
      // Update shopping list if provided
      if (response.shopping_list && Array.isArray(response.shopping_list)) {
        this.stateManager.updateState('shoppingList.items', response.shopping_list);
      }
      
      return response;
      
    } catch (error) {
      console.error('Error processing user message:', error);
      
      this.stateManager.updateState('chat.loading', false);
      this.stateManager.updateState('chat.error', error.message);
      
      throw error;
    }
  }

  /**
   * Get integration status
   * @returns {Object} Integration status information
   */
  getIntegrationStatus() {
    return {
      initialized: this.isInitialized,
      services: {
        search: this.stateManager.getState('integration.searchServiceConnected'),
        chat: this.stateManager.getState('integration.chatServiceConnected')
      },
      status: this.stateManager.getState('integration.status'),
      lastSync: this.stateManager.getState('integration.lastSync'),
      errors: this.stateManager.getState('integration.errors')
    };
  }

  /**
   * Reconnect to services
   */
  async reconnect() {
    console.log('Attempting to reconnect to services...');
    
    this.stateManager.updateState('integration.status', 'reconnecting');
    
    try {
      await this.testServiceConnections();
      this.stateManager.updateState('integration.status', 'connected');
      console.log('Reconnection successful');
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.stateManager.updateState('integration.status', 'error');
    }
  }

  /**
   * Clean up integration controller
   */
  cleanup() {
    // Stop periodic sync
    this.shoppingListSync.stopPeriodicSync();
    
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    console.log('Integration Controller cleaned up');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntegrationController;
} 