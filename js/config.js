/**
 * GrocerEase Integration Configuration
 * Centralized configuration for all integration services
 */

const GrocerEaseConfig = {
  // Service URLs
  services: {
    // Search Service (faissGrocerEase)
    search: {
      baseURL: process.env.SEARCH_SERVICE_URL || 'http://localhost:8000',
      endpoint: '/search/',
      timeout: 10000,
      retries: 3
    },
    
    // Chat Service (grocer-ease-chatbot)
    chat: {
      baseURL: process.env.CHAT_SERVICE_URL || 'http://localhost:8000',
      endpoint: '/api/v1',
      timeout: 15000,
      retries: 2
    }
  },

  // API Configuration
  api: {
    cors: {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    },
    retryDelays: [1000, 2000, 4000], // Exponential backoff delays
    maxRetries: 3
  },

  // Search Configuration
  search: {
    defaultRadius: 5, // km
    maxResults: 20,
    defaultLocation: {
      lat: 40.7128, // NYC coordinates
      lon: -74.0060
    },
    categories: [
      'dairy',
      'produce', 
      'meat',
      'pantry',
      'beverages',
      'frozen',
      'bakery',
      'general'
    ],
    sortOptions: [
      { value: 'relevance', label: 'Relevance' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'distance', label: 'Distance' }
    ]
  },

  // Chat Configuration
  chat: {
    maxMessageLength: 500,
    typingIndicatorDelay: 1000,
    messageRetention: 50, // Number of messages to keep in history
    autoSyncInterval: 30000, // 30 seconds
    searchIntentThreshold: 0.7 // Confidence threshold for search intent
  },

  // Location Configuration
  location: {
    defaultRadius: 5, // km
    maxRadius: 50, // km
    gpsTimeout: 10000, // 10 seconds
    gpsMaxAge: 300000, // 5 minutes
    fallbackLocation: {
      lat: 40.7128,
      lon: -74.0060,
      name: 'New York City'
    }
  },

  // Shopping List Configuration
  shoppingList: {
    maxItems: 100,
    syncInterval: 30000, // 30 seconds
    conflictResolution: 'ui_priority', // 'ui_priority', 'chat_priority', 'merge'
    autoSave: true,
    saveInterval: 5000 // 5 seconds
  },

  // UI Configuration
  ui: {
    theme: 'light', // 'light', 'dark', 'auto'
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h', // '12h', '24h'
    notifications: {
      enabled: true,
      duration: 5000, // 5 seconds
      position: 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
    },
    animations: {
      enabled: true,
      duration: 300
    }
  },

  // Performance Configuration
  performance: {
    debounceDelay: 300, // Search input debounce
    lazyLoading: true,
    cacheEnabled: true,
    cacheExpiry: 300000, // 5 minutes
    maxConcurrentRequests: 3
  },

  // Error Handling Configuration
  errorHandling: {
    showUserFriendlyErrors: true,
    logErrors: true,
    retryOnFailure: true,
    fallbackToCache: true,
    maxErrorRetries: 2
  },

  // Development Configuration
  development: {
    debugMode: false,
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    mockServices: false,
    performanceMonitoring: true,
    errorReporting: true
  },

  // Feature Flags
  features: {
    search: true,
    chat: true,
    shoppingList: true,
    locationServices: true,
    notifications: true,
    offlineMode: false,
    realTimeUpdates: false
  }
};

/**
 * Get configuration value by path
 * @param {string} path - Configuration path (e.g., 'services.search.baseURL')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Configuration value
 */
function getConfig(path, defaultValue = null) {
  try {
    const keys = path.split('.');
    let value = GrocerEaseConfig;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  } catch (error) {
    console.warn('Configuration access error:', error);
    return defaultValue;
  }
}

/**
 * Set configuration value by path
 * @param {string} path - Configuration path
 * @param {*} value - Value to set
 */
function setConfig(path, value) {
  try {
    const keys = path.split('.');
    let current = GrocerEaseConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    
    console.log(`Configuration updated: ${path} = ${value}`);
  } catch (error) {
    console.error('Configuration update error:', error);
  }
}

/**
 * Validate configuration
 * @returns {Object} Validation result
 */
function validateConfig() {
  const errors = [];
  const warnings = [];
  
  // Check required services
  if (!getConfig('services.search.baseURL')) {
    errors.push('Search service base URL is required');
  }
  
  if (!getConfig('services.chat.baseURL')) {
    errors.push('Chat service base URL is required');
  }
  
  // Check feature flags
  if (!getConfig('features.search') && !getConfig('features.chat')) {
    warnings.push('At least one service should be enabled');
  }
  
  // Check performance settings
  if (getConfig('performance.maxConcurrentRequests') > 10) {
    warnings.push('High concurrent request limit may cause performance issues');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get environment-specific configuration
 * @returns {Object} Environment configuration
 */
function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  const envConfigs = {
    development: {
      debugMode: true,
      logLevel: 'debug',
      mockServices: false
    },
    staging: {
      debugMode: false,
      logLevel: 'info',
      mockServices: false
    },
    production: {
      debugMode: false,
      logLevel: 'warn',
      mockServices: false,
      performanceMonitoring: true
    }
  };
  
  return envConfigs[env] || envConfigs.development;
}

/**
 * Initialize configuration with environment settings
 */
function initializeConfig() {
  const envConfig = getEnvironmentConfig();
  
  // Apply environment-specific settings
  Object.entries(envConfig).forEach(([key, value]) => {
    setConfig(`development.${key}`, value);
  });
  
  // Validate configuration
  const validation = validateConfig();
  
  if (!validation.valid) {
    console.error('Configuration validation failed:', validation.errors);
    throw new Error('Invalid configuration');
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Configuration warnings:', validation.warnings);
  }
  
  console.log('Configuration initialized successfully');
  return validation;
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GrocerEaseConfig,
    getConfig,
    setConfig,
    validateConfig,
    getEnvironmentConfig,
    initializeConfig
  };
} else {
  // Browser environment
  window.GrocerEaseConfig = GrocerEaseConfig;
  window.getConfig = getConfig;
  window.setConfig = setConfig;
  window.validateConfig = validateConfig;
  window.getEnvironmentConfig = getEnvironmentConfig;
  window.initializeConfig = initializeConfig;
} 