
import React, { useState } from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import StoreSelection from '../components/StoreSelection';
import ChatModal from '../components/ChatModal';

const StaffPage = () => {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const handleChatClick = () => {
    setIsChatModalOpen(true);
  };

  const handleStoreClick = () => {
    const storeSection = document.getElementById('storeSection');
    if (storeSection) {
      storeSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-end p-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt me-1"></i>Log Out
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

      <ChatModal 
        isOpen={isChatModalOpen} 
        onClose={() => setIsChatModalOpen(false)} 
      />
    </div>
  );
};

export default StaffPage;
