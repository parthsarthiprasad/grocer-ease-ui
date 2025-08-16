import React, { useState, useEffect } from 'react';
import './SettingsPage.css';

interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    shoppingReminders: boolean;
    priceAlerts: boolean;
    newProducts: boolean;
  };
  privacy: {
    shareLocation: boolean;
    sharePreferences: boolean;
    analytics: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: string;
    units: 'metric' | 'imperial';
  };
  shopping: {
    defaultRadius: number;
    favoriteCategories: string[];
    budgetAlerts: boolean;
    maxBudget: number;
  };
}

const SettingsPage: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: {
      email: true,
      push: true,
      sms: false,
      shoppingReminders: true,
      priceAlerts: true,
      newProducts: false
    },
    privacy: {
      shareLocation: true,
      sharePreferences: false,
      analytics: true
    },
    display: {
      theme: 'auto',
      language: 'en',
      currency: 'USD',
      units: 'metric'
    },
    shopping: {
      defaultRadius: 5,
      favoriteCategories: ['produce', 'dairy', 'pantry'],
      budgetAlerts: true,
      maxBudget: 200
    }
  });

  const [activeTab, setActiveTab] = useState('notifications');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('grocerEasePreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  const updatePreference = (section: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    localStorage.setItem('grocerEasePreferences', JSON.stringify(preferences));
    setSaving(false);
    setSaved(true);
    
    setTimeout(() => setSaved(false), 3000);
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all preferences to defaults?')) {
      const defaultPrefs: UserPreferences = {
        notifications: {
          email: true,
          push: true,
          sms: false,
          shoppingReminders: true,
          priceAlerts: true,
          newProducts: false
        },
        privacy: {
          shareLocation: true,
          sharePreferences: false,
          analytics: true
        },
        display: {
          theme: 'auto',
          language: 'en',
          currency: 'USD',
          units: 'metric'
        },
        shopping: {
          defaultRadius: 5,
          favoriteCategories: ['produce', 'dairy', 'pantry'],
          budgetAlerts: true,
          maxBudget: 200
        }
      };
      setPreferences(defaultPrefs);
    }
  };

  const categories = [
    { value: 'produce', label: 'Fresh Produce' },
    { value: 'dairy', label: 'Dairy & Eggs' },
    { value: 'meat', label: 'Fresh Meat' },
    { value: 'pantry', label: 'Pantry Essentials' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'frozen', label: 'Frozen Foods' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'organic', label: 'Organic Products' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' }
  ];

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' }
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1><i className="fas fa-cog"></i> Settings & Preferences</h1>
        <p className="text-muted">Customize your GrocerEase experience</p>
      </div>

      {/* Save Status */}
      {saved && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> Preferences saved successfully!
        </div>
      )}

      {/* Settings Navigation */}
      <div className="settings-nav">
        <button
          className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <i className="fas fa-bell"></i> Notifications
        </button>
        <button
          className={`nav-tab ${activeTab === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <i className="fas fa-shield-alt"></i> Privacy
        </button>
        <button
          className={`nav-tab ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          <i className="fas fa-palette"></i> Display
        </button>
        <button
          className={`nav-tab ${activeTab === 'shopping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shopping')}
        >
          <i className="fas fa-shopping-cart"></i> Shopping
        </button>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h3>Notification Preferences</h3>
            <p className="text-muted">Choose how and when you want to be notified</p>
            
            <div className="settings-group">
              <h4>Notification Channels</h4>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.email}
                    onChange={(e) => updatePreference('notifications', 'email', e.target.checked)}
                  />
                  Email Notifications
                </label>
                <span className="setting-description">Receive updates via email</span>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.push}
                    onChange={(e) => updatePreference('notifications', 'push', e.target.checked)}
                  />
                  Push Notifications
                </label>
                <span className="setting-description">Receive push notifications on your device</span>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.sms}
                    onChange={(e) => updatePreference('notifications', 'sms', e.target.checked)}
                  />
                  SMS Notifications
                </label>
                <span className="setting-description">Receive text message updates</span>
              </div>
            </div>

            <div className="settings-group">
              <h4>Notification Types</h4>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.shoppingReminders}
                    onChange={(e) => updatePreference('notifications', 'shoppingReminders', e.target.checked)}
                  />
                  Shopping Reminders
                </label>
                <span className="setting-description">Reminders about your shopping list</span>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.priceAlerts}
                    onChange={(e) => updatePreference('notifications', 'priceAlerts', e.target.checked)}
                  />
                  Price Alerts
                </label>
                <span className="setting-description">Alerts when prices drop on your favorite items</span>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.newProducts}
                    onChange={(e) => updatePreference('notifications', 'newProducts', e.target.checked)}
                  />
                  New Product Alerts
                </label>
                <span className="setting-description">Updates about new products in your favorite categories</span>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="settings-section">
            <h3>Privacy & Data</h3>
            <p className="text-muted">Control how your data is used and shared</p>
            
            <div className="settings-group">
              <h4>Data Sharing</h4>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.privacy.shareLocation}
                    onChange={(e) => updatePreference('privacy', 'shareLocation', e.target.checked)}
                  />
                  Share Location for Store Recommendations
                </label>
                <span className="setting-description">Allow us to use your location to suggest nearby stores</span>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.privacy.sharePreferences}
                    onChange={(e) => updatePreference('privacy', 'sharePreferences', e.target.checked)}
                  />
                  Share Shopping Preferences
                </label>
                <span className="setting-description">Help improve recommendations by sharing your preferences</span>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.privacy.analytics}
                    onChange={(e) => updatePreference('privacy', 'analytics', e.target.checked)}
                  />
                  Analytics & Usage Data
                </label>
                <span className="setting-description">Help us improve the app by sharing anonymous usage data</span>
              </div>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === 'display' && (
          <div className="settings-section">
            <h3>Display & Appearance</h3>
            <p className="text-muted">Customize how the app looks and feels</p>
            
            <div className="settings-group">
              <h4>Theme & Language</h4>
              <div className="setting-item">
                <label className="setting-label">Theme</label>
                <select
                  className="form-input form-select"
                  value={preferences.display.theme}
                  onChange={(e) => updatePreference('display', 'theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">Language</label>
                <select
                  className="form-input form-select"
                  value={preferences.display.language}
                  onChange={(e) => updatePreference('display', 'language', e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-group">
              <h4>Regional Settings</h4>
              <div className="setting-item">
                <label className="setting-label">Currency</label>
                <select
                  className="form-input form-select"
                  value={preferences.display.currency}
                  onChange={(e) => updatePreference('display', 'currency', e.target.value)}
                >
                  {currencies.map(curr => (
                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">Units</label>
                <select
                  className="form-input form-select"
                  value={preferences.display.units}
                  onChange={(e) => updatePreference('display', 'units', e.target.value)}
                >
                  <option value="metric">Metric (kg, km)</option>
                  <option value="imperial">Imperial (lb, mi)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Shopping Tab */}
        {activeTab === 'shopping' && (
          <div className="settings-section">
            <h3>Shopping Preferences</h3>
            <p className="text-muted">Customize your shopping experience</p>
            
            <div className="settings-group">
              <h4>Search & Discovery</h4>
              <div className="setting-item">
                <label className="setting-label">Default Search Radius</label>
                <select
                  className="form-input form-select"
                  value={preferences.shopping.defaultRadius}
                  onChange={(e) => updatePreference('shopping', 'defaultRadius', parseInt(e.target.value))}
                >
                  <option value={1}>1 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">Favorite Categories</label>
                <div className="categories-grid">
                  {categories.map(cat => (
                    <label key={cat.value} className="category-checkbox">
                      <input
                        type="checkbox"
                        checked={preferences.shopping.favoriteCategories.includes(cat.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updatePreference('shopping', 'favoriteCategories', 
                              [...preferences.shopping.favoriteCategories, cat.value]
                            );
                          } else {
                            updatePreference('shopping', 'favoriteCategories',
                              preferences.shopping.favoriteCategories.filter(c => c !== cat.value)
                            );
                          }
                        }}
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="settings-group">
              <h4>Budget & Spending</h4>
              <div className="setting-item">
                <label className="setting-label">
                  <input
                    type="checkbox"
                    checked={preferences.shopping.budgetAlerts}
                    onChange={(e) => updatePreference('shopping', 'budgetAlerts', e.target.checked)}
                  />
                  Enable Budget Alerts
                </label>
                <span className="setting-description">Get notified when you're approaching your budget limit</span>
              </div>
              
              <div className="setting-item">
                <label className="setting-label">Monthly Budget Limit</label>
                <input
                  type="number"
                  className="form-input"
                  value={preferences.shopping.maxBudget}
                  onChange={(e) => updatePreference('shopping', 'maxBudget', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="10"
                />
                <span className="setting-description">Set your monthly grocery budget limit</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <button className="btn btn-secondary" onClick={resetToDefaults}>
          <i className="fas fa-undo"></i> Reset to Defaults
        </button>
        <button 
          className="btn btn-primary" 
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i> Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage; 