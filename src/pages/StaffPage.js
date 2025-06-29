
import React from 'react';
import Sidebar from '../components/Sidebar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import StoreSelection from '../components/StoreSelection';

const StaffPage = () => {
  const handleLogout = () => {
    console.log('Logging out...');
    // Implement logout logic
  };

  const handleChatClick = () => {
    console.log('Opening staff chat modal...');
    // Implement staff chat modal logic
  };

  const handleStoreClick = () => {
    const storeSection = document.getElementById('storeSection');
    if (storeSection) {
      storeSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userType="staff" onLogout={handleLogout} />
      <div style={{ flex: 1, marginLeft: '250px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px' }}>
          <button className="btn btn-customer" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Log Out
          </button>
        </div>
        <Hero
          title="Staff Dashboard - Enhanced Shopping Experience"
          subtitle="Manage inventory, floorplans, and store operations"
          onChatClick={handleChatClick}
          onStoreClick={handleStoreClick}
        />
        <Features />
        <StoreSelection />
      </div>
    </div>
  );
};

export default StaffPage;
