import React, { useState, useEffect } from 'react';
import './SearchPage.css';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  lat: number;
  lon: number;
}

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [radius, setRadius] = useState('5');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'distance'>('relevance');

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('grocerEaseRecentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (query: string) => {
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('grocerEaseRecentSearches', JSON.stringify(updated));
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Save to recent searches
      saveRecentSearch(searchQuery);
      
      const searchParams = {
        query: searchQuery,
        lat: 40.7128, // Default NYC coordinates
        lon: -74.0060,
        radius_km: parseInt(radius),
        max_results: 20,
        categories: category ? [category] : [],
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined
      };
      
      // Clean up undefined values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key as keyof typeof searchParams] === undefined) {
          delete searchParams[key as keyof typeof searchParams];
        }
      });
      
      const response = await fetch('http://localhost:8000/search/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams)
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const results = await response.json();
      setSearchResults(results);
      
    } catch (error) {
      console.error('Search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    // Trigger search after a short delay to allow state update
    setTimeout(() => handleSearch(), 100);
  };

  const clearFilters = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setRadius('5');
    setSortBy('relevance');
  };

  const sortResults = (results: Product[]) => {
    switch (sortBy) {
      case 'price-low':
        return [...results].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...results].sort((a, b) => b.price - a.price);
      case 'distance':
        return [...results].sort((a, b) => {
          // Mock distance calculation
          const distanceA = Math.sqrt((a.lat - 40.7128) ** 2 + (a.lon + 74.0060) ** 2);
          const distanceB = Math.sqrt((b.lat - 40.7128) ** 2 + (b.lon + 74.0060) ** 2);
          return distanceA - distanceB;
        });
      default:
        return results;
    }
  };

  const addToShoppingList = (productName: string) => {
    // TODO: Implement shopping list functionality
    alert(`Added "${productName}" to shopping list`);
  };

  const viewProductDetails = (productId: string) => {
    // TODO: Implement product details view
    alert(`Viewing details for product ${productId}`);
  };

  const sortedResults = sortResults(searchResults);

  return (
    <div className="search-page">
      <div className="search-header">
        <h1><i className="fas fa-search"></i> Product Search</h1>
        <p className="text-muted">Find the products you need with our intelligent search</p>
      </div>
      
      {/* Search Form */}
      <div className="search-section">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-group">
            <input 
              type="text" 
              className="form-input search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products (e.g., organic milk, fresh bread, local produce)" 
              required
            />
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Searching...
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i> Search
                </>
              )}
            </button>
          </div>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="recent-searches">
            <span className="recent-label">Recent searches:</span>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                className="recent-search-tag"
                onClick={() => handleQuickSearch(search)}
              >
                {search}
              </button>
            ))}
          </div>
        )}
        
        {/* Search Filters Toggle */}
        <div className="filters-toggle">
          <button
            type="button"
            className="btn btn-outline btn-small"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter"></i> 
            {showFilters ? ' Hide Filters' : ' Show Filters'}
          </button>
          {showFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={clearFilters}
            >
              <i className="fas fa-times"></i> Clear All
            </button>
          )}
        </div>
        
        {/* Search Filters */}
        {showFilters && (
          <div className="search-filters">
            <div className="filters-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="categoryFilter">Category</label>
                <select 
                  className="form-input form-select" 
                  id="categoryFilter"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="dairy">Dairy</option>
                  <option value="produce">Produce</option>
                  <option value="meat">Meat</option>
                  <option value="pantry">Pantry</option>
                  <option value="beverages">Beverages</option>
                  <option value="frozen">Frozen</option>
                  <option value="bakery">Bakery</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="minPrice">Min Price</label>
                <input 
                  type="number" 
                  className="form-input" 
                  id="minPrice"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0.00" 
                  step="0.01" 
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="maxPrice">Max Price</label>
                <input 
                  type="number" 
                  className="form-input" 
                  id="maxPrice"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="100.00" 
                  step="0.01" 
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="radiusFilter">Radius</label>
                <select
                  className="form-input form-select" 
                  id="radiusFilter"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                >
                  <option value="1">1 km</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Search Results */}
      <div className="results-section">
        {error && (
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i> {error}
            <button 
              className="alert-close"
              onClick={() => setError(null)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        
        {loading && (
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Searching for products...
          </div>
        )}
        
        {!loading && !error && searchResults.length === 0 && searchQuery && (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <h3>No products found</h3>
            <p>Try adjusting your search terms or filters</p>
            <div className="no-results-suggestions">
              <h4>Suggestions:</h4>
              <ul>
                <li>Check your spelling</li>
                <li>Try more general terms</li>
                <li>Remove some filters</li>
                <li>Increase search radius</li>
              </ul>
            </div>
          </div>
        )}
        
        {!loading && !error && searchResults.length > 0 && (
          <>
            <div className="results-header">
              <div className="results-info">
                <h3>Found {searchResults.length} products</h3>
                <p className="text-muted">Results for "{searchQuery}"</p>
              </div>
              
              <div className="results-controls">
                <label className="sort-label">
                  Sort by:
                  <select
                    className="form-input form-select sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="distance">Distance</option>
                  </select>
                </label>
              </div>
            </div>
            
            <div className="product-grid">
              {sortedResults.map((product) => (
                <div key={product.id} className="product-card">
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">
                      {product.description || 'No description available'}
                    </p>
                    <div className="product-meta">
                      <span className="product-category">
                        <i className="fas fa-tag"></i> {product.category}
                      </span>
                      <span className="product-price">
                        <i className="fas fa-dollar-sign"></i> ${product.price.toFixed(2)}
                      </span>
                      <span className="product-distance">
                        <i className="fas fa-map-marker-alt"></i> 2.5 km
                      </span>
                    </div>
                  </div>
                  <div className="product-actions">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => addToShoppingList(product.name)}
                    >
                      <i className="fas fa-plus"></i> Add to List
                    </button>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => viewProductDetails(product.id)}
                    >
                      <i className="fas fa-info-circle"></i> Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage; 