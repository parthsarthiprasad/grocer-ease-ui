import React, { useState, useEffect } from 'react';
import './StorePage.css';

interface Store {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating: number;
  openNow: boolean;
  hours: string;
  phone: string;
  services: string[];
  lat: number;
  lon: number;
}

const StorePage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [radius, setRadius] = useState('5');

  // Mock store data
  const mockStores: Store[] = [
    {
      id: '1',
      name: 'Fresh Market Grocery',
      address: '123 Main St, Downtown',
      distance: 0.8,
      rating: 4.5,
      openNow: true,
      hours: '7:00 AM - 10:00 PM',
      phone: '(555) 123-4567',
      services: ['Delivery', 'Curbside Pickup', 'Organic Section'],
      lat: 40.7128,
      lon: -74.0060
    },
    {
      id: '2',
      name: 'Organic Valley Store',
      address: '456 Oak Ave, Midtown',
      distance: 1.2,
      rating: 4.8,
      openNow: true,
      hours: '6:00 AM - 11:00 PM',
      phone: '(555) 234-5678',
      services: ['Delivery', 'Bulk Items', 'Local Produce'],
      lat: 40.7589,
      lon: -73.9851
    },
    {
      id: '3',
      name: 'City Fresh Foods',
      address: '789 Pine St, Uptown',
      distance: 2.1,
      rating: 4.2,
      openNow: false,
      hours: '8:00 AM - 9:00 PM',
      phone: '(555) 345-6789',
      services: ['Delivery', 'International Foods'],
      lat: 40.7505,
      lon: -73.9934
    }
  ];

  useEffect(() => {
    setStores(mockStores);
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  };

  const searchStores = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStores(mockStores);
    setLoading(false);
  };

  const getDirections = (store: Store) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lon}`;
    window.open(url, '_blank');
  };

  const callStore = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <div className="store-page">
      <div className="store-header">
        <h1><i className="fas fa-store"></i> Find Nearby Stores</h1>
        <p className="text-muted">Discover grocery stores in your area with detailed information and services</p>
      </div>

      {/* Location and Search */}
      <div className="location-section">
        <div className="location-inputs">
          <div className="form-group">
            <label className="form-label" htmlFor="searchAddress">Search Address</label>
            <input
              type="text"
              className="form-input"
              id="searchAddress"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter address or zip code"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="searchRadius">Search Radius</label>
            <select
              className="form-input form-select"
              id="searchRadius"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            >
              <option value="1">1 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={searchStores} disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Searching...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i> Search Stores
              </>
            )}
          </button>
        </div>
        
        {userLocation && (
          <div className="current-location">
            <i className="fas fa-map-marker-alt"></i>
            <span>Using your current location</span>
            <button className="btn btn-small btn-outline" onClick={getUserLocation}>
              <i className="fas fa-refresh"></i> Refresh
            </button>
          </div>
        )}
      </div>

      {/* Store Results */}
      <div className="stores-section">
        {loading ? (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Finding stores near you...
          </div>
        ) : (
          <>
            <div className="results-header">
              <h3>Found {stores.length} stores</h3>
              <p className="text-muted">Showing stores within {radius} km</p>
            </div>
            
            <div className="stores-grid">
              {stores.map((store) => (
                <div key={store.id} className="store-card">
                  <div className="store-header-info">
                    <div className="store-name-rating">
                      <h3 className="store-name">{store.name}</h3>
                      <div className="store-rating">
                        <span className="stars">
                          {'★'.repeat(Math.floor(store.rating))}
                          {'☆'.repeat(5 - Math.floor(store.rating))}
                        </span>
                        <span className="rating-text">{store.rating}</span>
                      </div>
                    </div>
                    <div className="store-status">
                      <span className={`status-badge ${store.openNow ? 'open' : 'closed'}`}>
                        {store.openNow ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="store-details">
                    <div className="store-address">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{store.address}</span>
                    </div>
                    <div className="store-distance">
                      <i className="fas fa-route"></i>
                      <span>{store.distance} km away</span>
                    </div>
                    <div className="store-hours">
                      <i className="fas fa-clock"></i>
                      <span>{store.hours}</span>
                    </div>
                    <div className="store-phone">
                      <i className="fas fa-phone"></i>
                      <span>{store.phone}</span>
                    </div>
                  </div>
                  
                  <div className="store-services">
                    <h4>Services Available:</h4>
                    <div className="services-tags">
                      {store.services.map((service, index) => (
                        <span key={index} className="service-tag">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="store-actions">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => getDirections(store)}
                    >
                      <i className="fas fa-directions"></i> Get Directions
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => callStore(store.phone)}
                    >
                      <i className="fas fa-phone"></i> Call Store
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Map Integration Placeholder */}
      <div className="map-section">
        <h3><i className="fas fa-map"></i> Interactive Map</h3>
        <div className="map-placeholder">
          <i className="fas fa-map-marked-alt"></i>
          <p>Interactive map integration coming soon!</p>
          <p className="text-muted">View store locations on an interactive map</p>
        </div>
      </div>
    </div>
  );
};

export default StorePage; 