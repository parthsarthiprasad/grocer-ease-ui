
import React from 'react';
import Sidebar from '../components/Sidebar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import StoreSelection from '../components/StoreSelection';

const LaunchPage = () => {
  const handleChatClick = () => {
    console.log('Opening chat modal...');
    // Implement chat modal logic
  };

  const handleStoreClick = () => {
    const storeSection = document.getElementById('storeSection');
    if (storeSection) {
      storeSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStoreSelect = (store) => {
    console.log('Selected store:', store);
    // Implement store selection logic
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userType="customer" />
      <div style={{ flex: 1, marginLeft: '250px', display: 'flex', flexDirection: 'column' }}>
        <Hero
          title="Enhanced Shopping Experience"
          subtitle="Now with smart product selections and detailed shopping lists"
          onChatClick={handleChatClick}
          onStoreClick={handleStoreClick}
        />
        <Features />
        <StoreSelection onStoreSelect={handleStoreSelect} />
      </div>
    </div>
  );
};

export default LaunchPage;
