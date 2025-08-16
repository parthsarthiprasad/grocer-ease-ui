import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          <i className="fas fa-shopping-cart"></i> Welcome to GrocerEase
        </h1>
        <p className="hero-subtitle">
          Your AI-powered grocery shopping assistant. Find products, manage lists, and shop smarter with our integrated platform.
        </p>
        <div className="hero-actions">
          <Link to="/search" className="btn btn-primary btn-lg">
            <i className="fas fa-search"></i> Start Shopping
          </Link>
          <Link to="/chat" className="btn btn-outline btn-lg">
            <i className="fas fa-robot"></i> Chat with AI
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-search"></i>
          </div>
          <h3 className="feature-title">Smart Search</h3>
          <p className="feature-description">
            Find products with natural language queries and AI-powered recommendations.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-robot"></i>
          </div>
          <h3 className="feature-title">AI Assistant</h3>
          <p className="feature-description">
            Get help with shopping decisions, recipes, and product information.
          </p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <i className="fas fa-list-check"></i>
          </div>
          <h3 className="feature-title">Smart Lists</h3>
          <p className="feature-description">
            Manage your shopping list with intelligent categorization and reminders.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2 className="text-center mb-6">
          <i className="fas fa-bolt"></i> Quick Actions
        </h2>
        <div className="quick-actions-grid">
          <Link to="/search" className="quick-action-card">
            <i className="fas fa-search"></i>
            <h3>Search Products</h3>
            <p>Find what you need quickly</p>
          </Link>
          
          <Link to="/shopping-list" className="quick-action-card">
            <i className="fas fa-list"></i>
            <h3>View List</h3>
            <p>Check your shopping list</p>
          </Link>
          
          <Link to="/chat" className="quick-action-card">
            <i className="fas fa-comments"></i>
            <h3>Ask AI</h3>
            <p>Get shopping help</p>
          </Link>
          
          <Link to="/store" className="quick-action-card">
            <i className="fas fa-store"></i>
            <h3>Find Store</h3>
            <p>Locate nearby stores</p>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 