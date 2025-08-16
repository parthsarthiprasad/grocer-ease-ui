import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'fas fa-home', label: 'Home' },
    { path: '/search', icon: 'fas fa-search', label: 'Search Products' },
    { path: '/chat', icon: 'fas fa-comments', label: 'Chat Assistant' },
    { path: '/shopping-list', icon: 'fas fa-list', label: 'Shopping List' },
    { path: '/store', icon: 'fas fa-store', label: 'Find Store' },
    { path: '/floorplan', icon: 'fas fa-map', label: 'Floorplan' },
    { path: '/settings', icon: 'fas fa-cog', label: 'Settings' }
  ];

  return (
    <div className="sidebar">
      <Link to="/" className="logo">
        <i className="fas fa-shopping-cart"></i>
        GrocerEase
      </Link>
      
      <nav className="nav-links">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={item.icon}></i>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar; 