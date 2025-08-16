import React, { useState, useEffect } from 'react';
import './FloorplanPage.css';

interface Aisle {
  id: string;
  name: string;
  category: string;
  products: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Product {
  id: string;
  name: string;
  aisle: string;
  position: { x: number; y: number };
}

const FloorplanPage: React.FC = () => {
  const [selectedAisle, setSelectedAisle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [floorplanView, setFloorplanView] = useState<'2d' | '3d'>('2d');
  const [zoom, setZoom] = useState(1);

  // Mock floorplan data
  const aisles: Aisle[] = [
    {
      id: 'produce',
      name: 'Fresh Produce',
      category: 'Produce',
      products: ['Apples', 'Bananas', 'Tomatoes', 'Lettuce', 'Carrots'],
      x: 20,
      y: 20,
      width: 120,
      height: 60
    },
    {
      id: 'dairy',
      name: 'Dairy & Eggs',
      category: 'Dairy',
      products: ['Milk', 'Cheese', 'Yogurt', 'Eggs', 'Butter'],
      x: 160,
      y: 20,
      width: 100,
      height: 60
    },
    {
      id: 'meat',
      name: 'Fresh Meat',
      category: 'Meat',
      products: ['Chicken', 'Beef', 'Pork', 'Fish', 'Turkey'],
      x: 280,
      y: 20,
      width: 100,
      height: 60
    },
    {
      id: 'pantry',
      name: 'Pantry Essentials',
      category: 'Pantry',
      products: ['Rice', 'Pasta', 'Canned Goods', 'Oils', 'Spices'],
      x: 20,
      y: 100,
      width: 140,
      height: 60
    },
    {
      id: 'beverages',
      name: 'Beverages',
      category: 'Beverages',
      products: ['Water', 'Juice', 'Soda', 'Coffee', 'Tea'],
      x: 180,
      y: 100,
      width: 100,
      height: 60
    },
    {
      id: 'frozen',
      name: 'Frozen Foods',
      category: 'Frozen',
      products: ['Ice Cream', 'Frozen Vegetables', 'Frozen Meals'],
      x: 300,
      y: 100,
      width: 80,
      height: 60
    }
  ];

  const [searchResults, setSearchResults] = useState<Product[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = aisles.flatMap(aisle =>
        aisle.products
          .filter(product =>
            product.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(product => ({
            id: `${product}-${aisle.id}`,
            name: product,
            aisle: aisle.name,
            position: { x: aisle.x + aisle.width / 2, y: aisle.y + aisle.height / 2 }
          }))
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleAisleClick = (aisleId: string) => {
    setSelectedAisle(selectedAisle === aisleId ? null : aisleId);
  };

  const getAisleColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Produce': '#4CAF50',
      'Dairy': '#2196F3',
      'Meat': '#F44336',
      'Pantry': '#FF9800',
      'Beverages': '#9C27B0',
      'Frozen': '#00BCD4'
    };
    return colors[category] || '#757575';
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="floorplan-page">
      <div className="floorplan-header">
        <h1><i className="fas fa-map"></i> Store Floorplan</h1>
        <p className="text-muted">Navigate the store and find products with our interactive floorplan</p>
      </div>

      {/* Controls */}
      <div className="floorplan-controls">
        <div className="search-section">
          <div className="form-group">
            <label className="form-label" htmlFor="productSearch">Find Product</label>
            <input
              type="text"
              className="form-input"
              id="productSearch"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a product..."
            />
          </div>
        </div>

        <div className="view-controls">
          <div className="view-toggle">
            <button
              className={`btn ${floorplanView === '2d' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFloorplanView('2d')}
            >
              <i className="fas fa-square"></i> 2D View
            </button>
            <button
              className={`btn ${floorplanView === '3d' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFloorplanView('3d')}
            >
              <i className="fas fa-cube"></i> 3D View
            </button>
          </div>

          <div className="zoom-controls">
            <button className="btn btn-small btn-outline" onClick={zoomOut}>
              <i className="fas fa-search-minus"></i>
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="btn btn-small btn-outline" onClick={zoomIn}>
              <i className="fas fa-search-plus"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Found {searchResults.length} products:</h3>
          <div className="results-grid">
            {searchResults.map((product) => (
              <div key={product.id} className="product-result">
                <i className="fas fa-tag"></i>
                <span className="product-name">{product.name}</span>
                <span className="product-aisle">in {product.aisle}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floorplan Canvas */}
      <div className="floorplan-container">
        <div 
          className="floorplan-canvas"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Store entrance */}
          <div className="store-entrance">
            <i className="fas fa-door-open"></i>
            <span>Entrance</span>
          </div>

          {/* Checkout area */}
          <div className="checkout-area">
            <i className="fas fa-cash-register"></i>
            <span>Checkout</span>
          </div>

          {/* Aisles */}
          {aisles.map((aisle) => (
            <div
              key={aisle.id}
              className={`aisle ${selectedAisle === aisle.id ? 'selected' : ''}`}
              style={{
                left: `${aisle.x}px`,
                top: `${aisle.y}px`,
                width: `${aisle.width}px`,
                height: `${aisle.height}px`,
                backgroundColor: getAisleColor(aisle.category)
              }}
              onClick={() => handleAisleClick(aisle.id)}
            >
              <div className="aisle-label">{aisle.name}</div>
              <div className="aisle-category">{aisle.category}</div>
            </div>
          ))}

          {/* Product markers for search results */}
          {searchResults.map((product) => (
            <div
              key={product.id}
              className="product-marker"
              style={{
                left: `${product.position.x}px`,
                top: `${product.position.y}px`
              }}
            >
              <i className="fas fa-map-pin"></i>
            </div>
          ))}
        </div>
      </div>

      {/* Aisle Details */}
      {selectedAisle && (
        <div className="aisle-details">
          <div className="aisle-details-header">
            <h3>{aisles.find(a => a.id === selectedAisle)?.name}</h3>
            <button 
              className="close-btn"
              onClick={() => setSelectedAisle(null)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="aisle-products">
            <h4>Products in this aisle:</h4>
            <div className="products-list">
              {aisles.find(a => a.id === selectedAisle)?.products.map((product, index) => (
                <div key={index} className="aisle-product">
                  <i className="fas fa-tag"></i>
                  <span>{product}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="floorplan-legend">
        <h4><i className="fas fa-info-circle"></i> Floorplan Legend</h4>
        <div className="legend-items">
          {Array.from(new Set(aisles.map(a => a.category))).map((category) => (
            <div key={category} className="legend-item">
              <div 
                className="legend-color"
                style={{ backgroundColor: getAisleColor(category) }}
              ></div>
              <span>{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloorplanPage; 