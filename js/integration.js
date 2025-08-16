/**
 * GrocerEase Integration Script
 * Main entry point for integrating chat service and search service
 */

// Global integration instance
let grocerEaseIntegration = null;

/**
 * Initialize GrocerEase integration
 */
async function initializeGrocerEaseIntegration() {
  try {
    console.log('Initializing GrocerEase Integration...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async () => {
        await performIntegration();
      });
    } else {
      await performIntegration();
    }
    
  } catch (error) {
    console.error('Failed to initialize GrocerEase Integration:', error);
  }
}

/**
 * Perform the actual integration
 */
async function performIntegration() {
  try {
    // Create integration controller
    grocerEaseIntegration = new IntegrationController();
    
    // Wait for initialization
    await grocerEaseIntegration.init();
    
    // Set up UI integration
    setupUIIntegration();
    
    // Initialize search interface
    initializeSearchInterface();
    
    // Initialize enhanced chat interface
    initializeEnhancedChatInterface();
    
    // Set up shopping list integration
    setupShoppingListIntegration();
    
    console.log('GrocerEase Integration completed successfully');
    
    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('grocerEaseReady', {
      detail: { integration: grocerEaseIntegration }
    }));
    
  } catch (error) {
    console.error('GrocerEase Integration failed:', error);
    
    // Show error notification
    showNotification('Integration failed: ' + error.message, 'error');
  }
}

/**
 * Set up UI integration with existing elements
 */
function setupUIIntegration() {
  // Add search tab to sidebar
  addSearchTabToSidebar();
  
  // Enhance existing chat interface
  enhanceExistingChatInterface();
  
  // Add search functionality to existing UI
  addSearchFunctionality();
  
  // Set up location services
  setupLocationServices();
}

/**
 * Add search tab to sidebar navigation
 */
function addSearchTabToSidebar() {
  const sidebar = document.querySelector('.nav-links');
  if (!sidebar) return;
  
  const searchTab = document.createElement('button');
  searchTab.className = 'nav-btn';
  searchTab.innerHTML = '<i class="fas fa-search"></i> Search Products';
  searchTab.addEventListener('click', () => {
    showSearchModal();
  });
  
  // Insert after the first few tabs
  const insertAfter = sidebar.querySelector('.nav-btn:nth-child(2)');
  if (insertAfter) {
    insertAfter.parentNode.insertBefore(searchTab, insertAfter.nextSibling);
  } else {
    sidebar.appendChild(searchTab);
  }
}

/**
 * Initialize search interface
 */
function initializeSearchInterface() {
  // Create search modal
  createSearchModal();
  
  // Create search results container
  createSearchResultsContainer();
  
  // Set up search event listeners
  setupSearchEventListeners();
}

/**
 * Create search modal
 */
function createSearchModal() {
  const modalHTML = `
    <div id="searchModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2><i class="fas fa-search"></i> Search Products</h2>
          <span class="close" onclick="closeSearchModal()">&times;</span>
        </div>
        <div class="modal-body">
          <div class="search-input-container">
            <input type="text" id="searchInput" placeholder="Search for products..." />
            <button id="searchButton" onclick="performSearch()">
              <i class="fas fa-search"></i> Search
            </button>
          </div>
          <div class="search-filters">
            <div class="filter-group">
              <label>Categories:</label>
              <select id="categoryFilter">
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
            <div class="filter-group">
              <label>Price Range:</label>
              <input type="number" id="minPrice" placeholder="Min $" />
              <input type="number" id="maxPrice" placeholder="Max $" />
            </div>
            <div class="filter-group">
              <label>Radius:</label>
              <select id="radiusFilter">
                <option value="1">1 km</option>
                <option value="5" selected>5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
              </select>
            </div>
          </div>
          <div id="searchResults" class="search-results"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Create search results container
 */
function createSearchResultsContainer() {
  const resultsContainer = document.getElementById('searchResults');
  if (!resultsContainer) return;
  
  resultsContainer.innerHTML = `
    <div class="search-status">
      <div id="searchStatus" class="status-message">Enter a search query to find products</div>
      <div id="searchLoading" class="loading-spinner" style="display: none;">
        <i class="fas fa-spinner fa-spin"></i> Searching...
      </div>
    </div>
    <div id="searchResultsList" class="results-list"></div>
  `;
}

/**
 * Set up search event listeners
 */
function setupSearchEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  
  if (searchInput) {
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
    
    // Real-time search suggestions
    searchInput.addEventListener('input', debounce(() => {
      updateSearchSuggestions();
    }, 300));
  }
  
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  }
}

/**
 * Perform product search
 */
async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.trim();
  
  if (!query) {
    showNotification('Please enter a search query', 'warning');
    return;
  }
  
  try {
    // Show loading state
    showSearchLoading(true);
    
    // Get search filters
    const filters = getSearchFilters();
    
    // Perform search through integration controller
    const searchIntent = {
      type: 'product_search',
      query: query,
      confidence: 1.0,
      categories: filters.categories
    };
    
    await grocerEaseIntegration.performProductSearch(searchIntent);
    
    // Display results
    displaySearchResults();
    
  } catch (error) {
    console.error('Search failed:', error);
    showNotification('Search failed: ' + error.message, 'error');
  } finally {
    showSearchLoading(false);
  }
}

/**
 * Get search filters from UI
 */
function getSearchFilters() {
  const categoryFilter = document.getElementById('categoryFilter');
  const minPrice = document.getElementById('minPrice');
  const maxPrice = document.getElementById('maxPrice');
  const radiusFilter = document.getElementById('radiusFilter');
  
  return {
    categories: categoryFilter.value ? [categoryFilter.value] : [],
    minPrice: minPrice.value ? parseFloat(minPrice.value) : null,
    maxPrice: maxPrice.value ? parseFloat(maxPrice.value) : null,
    radius: radiusFilter.value ? parseInt(radiusFilter.value) : 5
  };
}

/**
 * Display search results
 */
function displaySearchResults() {
  const resultsList = document.getElementById('searchResultsList');
  const results = grocerEaseIntegration.stateManager.getState('search.results');
  const loading = grocerEaseIntegration.stateManager.getState('search.loading');
  const error = grocerEaseIntegration.stateManager.getState('search.error');
  
  if (loading) {
    resultsList.innerHTML = '<div class="loading">Searching...</div>';
    return;
  }
  
  if (error) {
    resultsList.innerHTML = `<div class="error">Error: ${error}</div>`;
    return;
  }
  
  if (!results || results.length === 0) {
    resultsList.innerHTML = '<div class="no-results">No products found</div>';
    return;
  }
  
  // Display results
  const resultsHTML = results.map(product => `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-meta">
          <span class="product-category">
            <i class="fas ${product.categoryIcon}"></i> ${product.category}
          </span>
          <span class="product-price">${product.formattedPrice}</span>
          <span class="product-distance">${product.distance}</span>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary" onclick="addToShoppingList('${product.id}')">
          <i class="fas fa-plus"></i> Add to List
        </button>
        <button class="btn btn-secondary" onclick="viewProductDetails('${product.id}')">
          <i class="fas fa-info-circle"></i> Details
        </button>
      </div>
    </div>
  `).join('');
  
  resultsList.innerHTML = resultsHTML;
}

/**
 * Show/hide search loading state
 */
function showSearchLoading(show) {
  const status = document.getElementById('searchStatus');
  const loading = document.getElementById('searchLoading');
  
  if (show) {
    status.style.display = 'none';
    loading.style.display = 'block';
  } else {
    status.style.display = 'block';
    loading.style.display = 'none';
  }
}

/**
 * Initialize enhanced chat interface
 */
function initializeEnhancedChatInterface() {
  // Enhance existing chat functionality
  enhanceChatFunctionality();
  
  // Add AI-powered responses
  addAIPoweredResponses();
  
  // Integrate with shopping list
  integrateChatWithShoppingList();
}

/**
 * Enhance existing chat functionality
 */
function enhanceChatFunctionality() {
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  
  if (messageInput && sendBtn) {
    // Replace existing send functionality
    const originalSendMessage = window.sendMessage;
    
    window.sendMessage = async function() {
      const message = messageInput.value.trim();
      if (!message) return;
      
      try {
        // Process through integration controller
        await grocerEaseIntegration.processUserMessage(message);
        
        // Clear input
        messageInput.value = '';
        
      } catch (error) {
        console.error('Enhanced chat failed:', error);
        showNotification('Chat failed: ' + error.message, 'error');
      }
    };
  }
}

/**
 * Set up shopping list integration
 */
function setupShoppingListIntegration() {
  // Subscribe to shopping list changes
  grocerEaseIntegration.stateManager.subscribe((change) => {
    if (change.path.includes('shoppingList.items')) {
      updateShoppingListDisplay();
    }
  }, 'shoppingList.items');
  
  // Initial update
  updateShoppingListDisplay();
}

/**
 * Update shopping list display
 */
function updateShoppingListDisplay() {
  const items = grocerEaseIntegration.stateManager.getState('shoppingList.items');
  const totalItems = grocerEaseIntegration.stateManager.getState('shoppingList.totalItems');
  const totalPrice = grocerEaseIntegration.stateManager.getState('shoppingList.totalPrice');
  
  // Update existing shopping list if available
  const existingList = document.querySelector('.shopping-list');
  if (existingList) {
    // Update item count displays
    const itemCountElements = document.querySelectorAll('#item-count');
    itemCountElements.forEach(el => {
      el.textContent = totalItems;
    });
    
    // Update total price if available
    const totalPriceElements = document.querySelectorAll('.total-price');
    totalPriceElements.forEach(el => {
      el.textContent = `$${totalPrice.toFixed(2)}`;
    });
  }
}

/**
 * Utility functions
 */
function showSearchModal() {
  const modal = document.getElementById('searchModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

function closeSearchModal() {
  const modal = document.getElementById('searchModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-message">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize integration when script loads
initializeGrocerEaseIntegration(); 