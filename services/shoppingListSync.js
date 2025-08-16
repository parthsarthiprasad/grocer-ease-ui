/**
 * ShoppingListSync - Synchronizes shopping list between chat service and UI
 * Handles bidirectional sync, conflict resolution, and real-time updates
 */

class ShoppingListSync {
  constructor(chatService, stateManager) {
    this.chatService = chatService;
    this.stateManager = stateManager;
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.syncInProgress = false;
    this.conflictResolution = 'ui_priority'; // 'ui_priority', 'chat_priority', 'merge'
    
    // Initialize sync
    this.init();
  }

  /**
   * Initialize shopping list synchronization
   */
  init() {
    // Subscribe to shopping list changes
    this.stateManager.subscribe(this.handleUIChange.bind(this), 'shoppingList');
    
    // Subscribe to chat service changes
    this.stateManager.subscribe(this.handleChatChange.bind(this), 'chat');
    
    // Start periodic sync
    this.startPeriodicSync();
    
    console.log('ShoppingListSync initialized');
  }

  /**
   * Start periodic synchronization with chat service
   * @param {number} interval - Sync interval in milliseconds (default: 30 seconds)
   */
  startPeriodicSync(interval = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.syncWithChat();
    }, interval);
    
    console.log(`Periodic sync started with ${interval}ms interval`);
  }

  /**
   * Stop periodic synchronization
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }

  /**
   * Synchronize shopping list with chat service
   * @param {boolean} force - Force sync even if not needed
   * @returns {Promise<boolean>} Sync success status
   */
  async syncWithChat(force = false) {
    if (this.syncInProgress && !force) {
      console.log('Sync already in progress, skipping');
      return false;
    }

    try {
      this.syncInProgress = true;
      
      const uiList = this.stateManager.getState('shoppingList');
      const lastChatSync = this.stateManager.getState('chat.lastSync');
      
      // Check if sync is needed
      if (!force && lastChatSync && (Date.now() - lastChatSync) < 5000) {
        console.log('Sync not needed, last sync was recent');
        return true;
      }
      
      console.log('Starting shopping list sync with chat service');
      
      // Get current chat shopping list
      const chatResponse = await this.chatService.sendMessage('get shopping list', null);
      const chatList = chatResponse.shopping_list || [];
      
      // Compare lists and resolve conflicts
      const syncResult = this.resolveConflicts(uiList.items, chatList);
      
      // Update UI state
      this.stateManager.batchUpdate({
        'shoppingList.items': syncResult.resolvedItems,
        'shoppingList.lastUpdated': Date.now(),
        'shoppingList.syncedWithChat': true,
        'chat.lastSync': Date.now()
      });
      
      this.lastSyncTime = Date.now();
      console.log('Shopping list sync completed successfully');
      
      return true;
    } catch (error) {
      console.error('Shopping list sync failed:', error);
      
      // Update sync status
      this.stateManager.updateState('integration.errors', [
        ...this.stateManager.getState('integration.errors'),
        {
          type: 'sync_error',
          message: 'Shopping list sync failed',
          error: error.message,
          timestamp: Date.now()
        }
      ]);
      
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Handle UI shopping list changes
   * @param {Object} change - State change object
   */
  handleUIChange(change) {
    if (change.path.includes('shoppingList.items')) {
      console.log('UI shopping list changed, scheduling sync');
      
      // Debounce sync to avoid excessive API calls
      setTimeout(() => {
        this.syncWithChat();
      }, 2000);
    }
  }

  /**
   * Handle chat service changes
   * @param {Object} change - State change object
   */
  handleChatChange(change) {
    if (change.path.includes('messages') && change.newValue) {
      const lastMessage = change.newValue[change.newValue.length - 1];
      
      // Check if message contains shopping list updates
      if (lastMessage && lastMessage.shoppingList) {
        console.log('Chat shopping list updated, syncing with UI');
        this.syncWithChat();
      }
    }
  }

  /**
   * Resolve conflicts between UI and chat shopping lists
   * @param {Array} uiItems - UI shopping list items
   * @param {Array} chatItems - Chat service shopping list items
   * @returns {Object} Resolved items and conflict info
   */
  resolveConflicts(uiItems, chatItems) {
    const conflicts = [];
    const resolvedItems = [];
    
    // Create maps for easy lookup
    const uiMap = new Map();
    const chatMap = new Map();
    
    uiItems.forEach(item => {
      const key = this.getItemKey(item);
      uiMap.set(key, item);
    });
    
    chatItems.forEach(item => {
      const key = this.getItemKey(item);
      chatMap.set(key, item);
    });
    
    // Process all items
    const allKeys = new Set([...uiMap.keys(), ...chatMap.keys()]);
    
    allKeys.forEach(key => {
      const uiItem = uiMap.get(key);
      const chatItem = chatMap.get(key);
      
      if (uiItem && chatItem) {
        // Item exists in both lists - check for conflicts
        if (this.itemsConflict(uiItem, chatItem)) {
          conflicts.push({
            key: key,
            uiItem: uiItem,
            chatItem: chatItem,
            resolution: this.resolveItemConflict(uiItem, chatItem)
          });
          
          resolvedItems.push(conflicts[conflicts.length - 1].resolution);
        } else {
          // No conflict, use UI item (more recent)
          resolvedItems.push(uiItem);
        }
      } else if (uiItem) {
        // Item only in UI
        resolvedItems.push(uiItem);
      } else if (chatItem) {
        // Item only in chat
        resolvedItems.push(chatItem);
      }
    });
    
    return {
      resolvedItems: resolvedItems,
      conflicts: conflicts,
      resolution: this.conflictResolution
    };
  }

  /**
   * Generate unique key for shopping list item
   * @param {Object} item - Shopping list item
   * @returns {string} Unique key
   */
  getItemKey(item) {
    // Use name and variant as key, fallback to just name
    if (item.variant && item.variant !== 'default') {
      return `${item.name.toLowerCase()}_${item.variant.toLowerCase()}`;
    }
    return item.name.toLowerCase();
  }

  /**
   * Check if two items conflict
   * @param {Object} item1 - First item
   * @param {Object} item2 - Second item
   * @returns {boolean} Whether items conflict
   */
  itemsConflict(item1, item2) {
    // Check for quantity conflicts
    if (item1.quantity !== item2.quantity) {
      return true;
    }
    
    // Check for variant conflicts
    if (item1.variant !== item2.variant) {
      return true;
    }
    
    // Check for completion status conflicts
    if (item1.completed !== item2.completed) {
      return true;
    }
    
    return false;
  }

  /**
   * Resolve conflict between two items
   * @param {Object} uiItem - UI item
   * @param {Object} chatItem - Chat item
   * @returns {Object} Resolved item
   */
  resolveItemConflict(uiItem, chatItem) {
    switch (this.conflictResolution) {
      case 'ui_priority':
        return { ...uiItem, lastUpdated: Date.now() };
      
      case 'chat_priority':
        return { ...chatItem, lastUpdated: Date.now() };
      
      case 'merge':
      default:
        // Merge items, preferring UI for most fields, chat for others
        return {
          ...uiItem,
          quantity: Math.max(uiItem.quantity || 1, chatItem.quantity || 1),
          completed: uiItem.completed || chatItem.completed,
          lastUpdated: Date.now(),
          merged: true
        };
    }
  }

  /**
   * Add item from chat to shopping list
   * @param {Object} item - Item to add
   * @returns {boolean} Success status
   */
  addItemFromChat(item) {
    try {
      const currentList = this.stateManager.getState('shoppingList.items');
      const existingItem = currentList.find(existing => 
        this.getItemKey(existing) === this.getItemKey(item)
      );
      
      if (existingItem) {
        // Update existing item
        const updatedList = currentList.map(existing => 
          this.getItemKey(existing) === this.getItemKey(item)
            ? { ...existing, quantity: (existing.quantity || 1) + (item.quantity || 1) }
            : existing
        );
        
        this.stateManager.updateState('shoppingList.items', updatedList);
      } else {
        // Add new item
        const newItem = {
          ...item,
          id: this.generateItemId(),
          addedAt: Date.now(),
          source: 'chat'
        };
        
        this.stateManager.updateState('shoppingList.items', [...currentList, newItem]);
      }
      
      // Update totals
      this.updateShoppingListTotals();
      
      console.log('Item added from chat:', item);
      return true;
    } catch (error) {
      console.error('Error adding item from chat:', error);
      return false;
    }
  }

  /**
   * Remove item from both services
   * @param {string} itemKey - Item key to remove
   * @returns {boolean} Success status
   */
  async removeItemFromChat(itemKey) {
    try {
      // Remove from UI
      const currentList = this.stateManager.getState('shoppingList.items');
      const updatedList = currentList.filter(item => 
        this.getItemKey(item) !== itemKey
      );
      
      this.stateManager.updateState('shoppingList.items', updatedList);
      
      // Send removal message to chat service
      const item = currentList.find(item => this.getItemKey(item) === itemKey);
      if (item) {
        await this.chatService.sendMessage(`remove ${item.name} from shopping list`);
      }
      
      // Update totals
      this.updateShoppingListTotals();
      
      console.log('Item removed:', itemKey);
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      return false;
    }
  }

  /**
   * Update shopping list totals
   */
  updateShoppingListTotals() {
    const items = this.stateManager.getState('shoppingList.items');
    
    const totalItems = items.length;
    const totalPrice = items.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    this.stateManager.updateState('shoppingList.totalItems', totalItems);
    this.stateManager.updateState('shoppingList.totalPrice', totalPrice);
  }

  /**
   * Generate unique item ID
   * @returns {string} Unique ID
   */
  generateItemId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get sync status
   * @returns {Object} Sync status information
   */
  getSyncStatus() {
    return {
      lastSync: this.lastSyncTime,
      inProgress: this.syncInProgress,
      interval: this.syncInterval ? 30000 : null,
      lastError: this.stateManager.getState('integration.errors').slice(-1)[0] || null
    };
  }

  /**
   * Set conflict resolution strategy
   * @param {string} strategy - Resolution strategy
   */
  setConflictResolution(strategy) {
    if (['ui_priority', 'chat_priority', 'merge'].includes(strategy)) {
      this.conflictResolution = strategy;
      console.log('Conflict resolution strategy set to:', strategy);
    } else {
      console.warn('Invalid conflict resolution strategy:', strategy);
    }
  }

  /**
   * Force immediate sync
   * @returns {Promise<boolean>} Sync success status
   */
  async forceSync() {
    console.log('Forcing immediate sync');
    return await this.syncWithChat(true);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShoppingListSync;
} 