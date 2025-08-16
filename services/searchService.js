/**
 * SearchService - Integration with faissGrocerEase Search API
 * Handles product search, filtering, and geolocation-based queries
 */

class SearchService {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.endpoint = '/search/';
    this.timeout = 10000;
    this.retries = 3;
  }

  /**
   * Search for products using semantic search and filters
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Array>} Array of product results
   */
  async searchProducts(searchParams) {
    const defaultParams = {
      query: '',
      lat: 40.7128, // Default to NYC coordinates
      lon: -74.0060,
      radius_km: 5,
      max_results: 20,
      min_price: null,
      max_price: null,
      categories: [],
      sort_by: null,
      show_only_available: false
    };

    const params = { ...defaultParams, ...searchParams };
    
    // Clean up null/undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    try {
      const response = await this._makeRequest(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      return this._processSearchResults(results);
    } catch (error) {
      console.error('SearchService.searchProducts error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Get product details by ID
   * @param {string} productId - Product UUID
   * @returns {Promise<Object>} Product details
   */
  async getProductDetails(productId) {
    try {
      const response = await this._makeRequest(`/products/${productId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Product details failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SearchService.getProductDetails error:', error);
      throw new Error(`Failed to get product details: ${error.message}`);
    }
  }

  /**
   * Get available product categories
   * @returns {Promise<Array>} Array of category names
   */
  async getCategories() {
    try {
      const response = await this._makeRequest('/categories', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Categories failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('SearchService.getCategories error:', error);
      // Return default categories if API fails
      return ['dairy', 'produce', 'meat', 'pantry', 'beverages', 'frozen', 'bakery'];
    }
  }

  /**
   * Process and enhance search results
   * @param {Array} results - Raw API results
   * @returns {Array} Processed results with additional metadata
   */
  _processSearchResults(results) {
    return results.map(product => ({
      ...product,
      distance: this._calculateDistance(product.lat, product.lon),
      formattedPrice: this._formatPrice(product.price),
      categoryIcon: this._getCategoryIcon(product.category)
    }));
  }

  /**
   * Calculate distance from user location (placeholder)
   * @param {number} lat - Product latitude
   * @param {number} lon - Product longitude
   * @returns {string} Formatted distance
   */
  _calculateDistance(lat, lon) {
    // TODO: Implement actual distance calculation from user location
    return '2.5 km'; // Placeholder
  }

  /**
   * Format price for display
   * @param {number} price - Product price
   * @returns {string} Formatted price
   */
  _formatPrice(price) {
    return `$${price.toFixed(2)}`;
  }

  /**
   * Get icon for product category
   * @param {string} category - Product category
   * @returns {string} FontAwesome icon class
   */
  _getCategoryIcon(category) {
    const iconMap = {
      'dairy': 'fa-milk-bottle',
      'produce': 'fa-apple-alt',
      'meat': 'fa-drumstick-bite',
      'pantry': 'fa-wheat-awn',
      'beverages': 'fa-wine-bottle',
      'frozen': 'fa-snowflake',
      'bakery': 'fa-bread-slice'
    };
    return iconMap[category.toLowerCase()] || 'fa-shopping-bag';
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Response>} HTTP response
   */
  async _makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
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
      const response = await this._makeRequest('/', { method: 'GET' });
      return response.ok;
    } catch (error) {
      console.error('SearchService connection test failed:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchService;
} 