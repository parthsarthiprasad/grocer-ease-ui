/**
 * ChatService - Integration with grocer-ease-chatbot API
 * Handles natural language processing, chat responses, and shopping list management
 */

class ChatService {
  constructor(baseURL = null) {
    this.baseURL = baseURL || (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace("/api/v1", "") : "http://localhost:8000");
    this.endpoint = '/api/v1';
    this.timeout = 15000;
    this.retries = 2;
    this.currentUserId = this._generateUserId();
  }

  /**
   * Send a message to the chatbot and get response
   * @param {string} message - User message
   * @param {string} userId - Optional user ID (uses generated if not provided)
   * @returns {Promise<Object>} Chat response with shopping list
   */
  async sendMessage(message, userId = null) {
    const uid = userId || this.currentUserId;
    
    try {
      const response = await this._makeRequest('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: uid,
          user_message: message
        })
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return this._processChatResponse(result, message);
    } catch (error) {
      console.error('ChatService.sendMessage error:', error);
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId = null) {
    const uid = userId || this.currentUserId;
    
    try {
      const response = await this._makeRequest(`/preferences/${uid}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Preferences failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ChatService.getUserPreferences error:', error);
      return {}; // Return empty preferences on error
    }
  }

  /**
   * Set user preference
   * @param {string} preference - Preference key
   * @param {string} value - Preference value
   * @param {string} userId - Optional user ID
   * @returns {Promise<boolean>} Success status
   */
  async setUserPreference(preference, value, userId = null) {
    const uid = userId || this.currentUserId;
    
    try {
      const response = await this._makeRequest('/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: uid,
          preference: preference,
          value: value
        })
      });

      if (!response.ok) {
        throw new Error(`Set preference failed: ${response.status}`);
      }

      const result = await response.json();
      return result.success || false;
    } catch (error) {
      console.error('ChatService.setUserPreference error:', error);
      return false;
    }
  }

  /**
   * Extract product search intent from chat message
   * @param {string} message - Chat message
   * @returns {Object|null} Search intent or null if no product search
   */
  extractSearchIntent(message) {
    const searchPatterns = [
      // Direct product requests
      /(?:I need|I want|find|search for|looking for)\s+(.+?)(?:\s|$)/i,
      // Recipe ingredients
      /(?:ingredients? for|recipe for|make|cook)\s+(.+?)(?:\s|$)/i,
      // Shopping requests
      /(?:add|buy|get)\s+(.+?)(?:\s+to\s+my\s+shopping\s+list|\s|$)/i,
      // General product queries
      /(?:where can I find|where to buy|best)\s+(.+?)(?:\s|$)/i
    ];

    for (const pattern of searchPatterns) {
      const match = message.match(pattern);
      if (match) {
        const query = match[1].trim();
        return {
          type: 'product_search',
          query: query,
          confidence: 0.8,
          categories: this._suggestCategories(query)
        };
      }
    }

    return null;
  }

  /**
   * Process chat response and extract actionable data
   * @param {Object} response - API response
   * @param {string} originalMessage - Original user message
   * @returns {Object} Processed response with metadata
   */
  _processChatResponse(response, originalMessage) {
    const searchIntent = this.extractSearchIntent(originalMessage);
    
    return {
      ...response,
      searchIntent: searchIntent,
      timestamp: new Date().toISOString(),
      messageId: this._generateMessageId(),
      hasProductQuery: searchIntent !== null
    };
  }

  /**
   * Suggest product categories based on query
   * @param {string} query - Search query
   * @returns {Array} Suggested categories
   */
  _suggestCategories(query) {
    const queryLower = query.toLowerCase();
    const categoryMap = {
      'milk': ['dairy'],
      'cheese': ['dairy'],
      'yogurt': ['dairy'],
      'apple': ['produce'],
      'banana': ['produce'],
      'tomato': ['produce'],
      'chicken': ['meat'],
      'beef': ['meat'],
      'pork': ['meat'],
      'bread': ['bakery'],
      'cake': ['bakery'],
      'cookie': ['bakery'],
      'water': ['beverages'],
      'juice': ['beverages'],
      'soda': ['beverages'],
      'rice': ['pantry'],
      'pasta': ['pantry'],
      'flour': ['pantry'],
      'ice cream': ['frozen'],
      'frozen pizza': ['frozen']
    };

    for (const [key, categories] of Object.entries(categoryMap)) {
      if (queryLower.includes(key)) {
        return categories;
      }
    }

    return ['general'];
  }

  /**
   * Generate unique user ID for session
   * @returns {string} Generated user ID
   */
  _generateUserId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `user_${timestamp}_${random}`;
  }

  /**
   * Generate unique message ID
   * @returns {string} Generated message ID
   */
  _generateMessageId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `msg_${timestamp}_${random}`;
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Response>} HTTP response
   */
  async _makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${this.endpoint}${endpoint}`;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        if (attempt === this.retries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Test API connectivity
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const response = await this._makeRequest('/health', { method: 'GET' });
      return response.ok;
    } catch (error) {
      console.error('ChatService connection test failed:', error);
      return false;
    }
  }

  /**
   * Get current user ID
   * @returns {string} Current user ID
   */
  getCurrentUserId() {
    return this.currentUserId;
  }

  /**
   * Set custom user ID
   * @param {string} userId - Custom user ID
   */
  setUserId(userId) {
    this.currentUserId = userId;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatService;
} 