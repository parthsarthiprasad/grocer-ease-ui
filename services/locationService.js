/**
 * LocationService - Handles geolocation and store-based location for search
 * Provides location data for product search and user experience
 */

class LocationService {
  constructor() {
    this.userLocation = null;
    this.selectedStore = null;
    this.defaultRadius = 5; // km
    this.defaultLocation = { lat: 40.7128, lon: -74.0060 }; // NYC coordinates
    this.locationPermission = 'prompt';
    
    // Initialize location services
    this.init();
  }

  /**
   * Initialize location services
   */
  async init() {
    try {
      // Check if geolocation is supported
      if ('geolocation' in navigator) {
        // Get stored location permission
        this.locationPermission = localStorage.getItem('locationPermission') || 'prompt';
        
        // Try to get user location if permission granted
        if (this.locationPermission === 'granted') {
          await this.getUserLocation();
        }
      }
      
      // Load selected store from localStorage
      this.loadSelectedStore();
      
      console.log('LocationService initialized');
    } catch (error) {
      console.error('LocationService init error:', error);
    }
  }

  /**
   * Get user's current GPS location
   * @returns {Promise<Object>} Location object with lat/lon
   */
  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            source: 'gps'
          };
          
          this.userLocation = location;
          this.locationPermission = 'granted';
          localStorage.setItem('locationPermission', 'granted');
          
          console.log('User location obtained:', location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              this.locationPermission = 'denied';
              localStorage.setItem('locationPermission', 'denied');
              reject(new Error('Location permission denied'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out'));
              break;
            default:
              reject(new Error('Unknown location error'));
          }
        },
        options
      );
    });
  }

  /**
   * Request location permission from user
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestLocationPermission() {
    try {
      if (this.locationPermission === 'granted') {
        return true;
      }
      
      if (this.locationPermission === 'denied') {
        throw new Error('Location permission previously denied');
      }
      
      // Try to get location (this will trigger permission request)
      await this.getUserLocation();
      return true;
    } catch (error) {
      console.error('Location permission request failed:', error);
      return false;
    }
  }

  /**
   * Set selected store location
   * @param {Object} storeData - Store information
   */
  setSelectedStore(storeData) {
    this.selectedStore = {
      id: storeData.id || storeData.name,
      name: storeData.name,
      lat: storeData.lat,
      lon: storeData.lon,
      address: storeData.address,
      selectedAt: Date.now()
    };
    
    // Save to localStorage
    localStorage.setItem('selectedStore', JSON.stringify(this.selectedStore));
    
    console.log('Selected store set:', this.selectedStore);
  }

  /**
   * Get current search location (priority: User GPS > Selected Store > Default)
   * @returns {Object} Location object for search
   */
  getSearchLocation() {
    if (this.userLocation && this.locationPermission === 'granted') {
      return {
        lat: this.userLocation.lat,
        lon: this.userLocation.lon,
        source: 'user_gps',
        radius: this.defaultRadius
      };
    }
    
    if (this.selectedStore) {
      return {
        lat: this.selectedStore.lat,
        lon: this.selectedStore.lon,
        source: 'selected_store',
        radius: this.defaultRadius
      };
    }
    
    return {
      lat: this.defaultLocation.lat,
      lon: this.defaultLocation.lon,
      source: 'default',
      radius: this.defaultRadius
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - First latitude
   * @param {number} lon1 - First longitude
   * @param {number} lat2 - Second latitude
   * @param {number} lon2 - Second longitude
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param {number} deg - Degrees
   * @returns {number} Radians
   */
  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Format distance for display
   * @param {number} distance - Distance in kilometers
   * @returns {string} Formatted distance
   */
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance)}km`;
    }
  }

  /**
   * Get location status and information
   * @returns {Object} Location status object
   */
  getLocationStatus() {
    return {
      userLocation: this.userLocation,
      selectedStore: this.selectedStore,
      permission: this.locationPermission,
      searchLocation: this.getSearchLocation(),
      hasLocation: !!(this.userLocation || this.selectedStore)
    };
  }

  /**
   * Load selected store from localStorage
   */
  loadSelectedStore() {
    try {
      const stored = localStorage.getItem('selectedStore');
      if (stored) {
        this.selectedStore = JSON.parse(stored);
        console.log('Selected store loaded from storage:', this.selectedStore);
      }
    } catch (error) {
      console.error('Error loading selected store:', error);
    }
  }

  /**
   * Clear selected store
   */
  clearSelectedStore() {
    this.selectedStore = null;
    localStorage.removeItem('selectedStore');
    console.log('Selected store cleared');
  }

  /**
   * Get nearby stores (placeholder for future implementation)
   * @param {number} radius - Search radius in kilometers
   * @returns {Promise<Array>} Array of nearby stores
   */
  async getNearbyStores(radius = 10) {
    // TODO: Implement actual store search API
    const mockStores = [
      {
        id: 'store1',
        name: 'Fresh Market',
        lat: 40.7128,
        lon: -74.0060,
        address: '123 Main St, New York, NY',
        distance: 0.5
      },
      {
        id: 'store2',
        name: 'Grocery Plus',
        lat: 40.7140,
        lon: -74.0080,
        address: '456 Oak Ave, New York, NY',
        distance: 1.2
      }
    ];
    
    return mockStores.filter(store => store.distance <= radius);
  }

  /**
   * Update search radius
   * @param {number} radius - New radius in kilometers
   */
  updateSearchRadius(radius) {
    this.defaultRadius = Math.max(1, Math.min(50, radius)); // Limit between 1-50km
    console.log('Search radius updated:', this.defaultRadius);
  }

  /**
   * Get location-based search suggestions
   * @returns {Array} Array of search suggestions
   */
  getLocationSuggestions() {
    const location = this.getSearchLocation();
    const suggestions = [];
    
    if (location.source === 'user_gps') {
      suggestions.push('Searching near your current location');
    } else if (location.source === 'selected_store') {
      suggestions.push(`Searching near ${this.selectedStore.name}`);
    } else {
      suggestions.push('Searching in default area');
    }
    
    suggestions.push(`Within ${this.defaultRadius}km radius`);
    
    return suggestions;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocationService;
} 