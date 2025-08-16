import React, { useState, useEffect } from 'react';
import './ShoppingListPage.css';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  completed: boolean;
  price?: number;
  addedAt: number;
}

const ShoppingListPage: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    category: 'general'
  });

  useEffect(() => {
    // Load from localStorage
    const savedItems = localStorage.getItem('grocerEaseShoppingList');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('grocerEaseShoppingList', JSON.stringify(items));
  }, [items]);

  const addItem = () => {
    if (!newItem.name.trim()) return;

    const item: ShoppingItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newItem.name.trim(),
      quantity: newItem.quantity,
      category: newItem.category,
      completed: false,
      addedAt: Date.now()
    };

    setItems(prev => [...prev, item]);
    setNewItem({ name: '', quantity: 1, category: 'general' });
    setShowAddModal(false);
  };

  const toggleItemComplete = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const editItem = (itemId: string) => {
    const item = items.find(item => item.id === itemId);
    if (item) {
      const newName = prompt('Enter new item name:', item.name);
      if (newName && newName.trim() && newName !== item.name) {
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, name: newName.trim() } : item
        ));
      }
    }
  };

  const totalItems = items.length;
  const completedItems = items.filter(item => item.completed).length;
  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="shopping-list-page">
      <div className="shopping-list-header">
        <h1><i className="fas fa-shopping-basket"></i> Smart Shopping List</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <i className="fas fa-plus"></i> Add Item
        </button>
      </div>
      
      {/* Stats */}
      <div className="shopping-list-stats">
        <div className="stat-item">
          <span className="stat-value">{totalItems}</span>
          <span className="stat-label">Total Items</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{completedItems}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">${totalPrice.toFixed(2)}</span>
          <span className="stat-label">Total Price</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0}%</span>
          <span className="stat-label">Progress</span>
        </div>
      </div>
      
      {/* Shopping List Items */}
      <div className="shopping-list-items">
        {items.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-shopping-basket"></i>
            <h3>Your shopping list is empty</h3>
            <p>Start adding items to get organized!</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <i className="fas fa-plus"></i> Add Your First Item
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`shopping-item ${item.completed ? 'completed' : ''}`}>
              <div className="item-info">
                <input
                  type="checkbox"
                  className="item-checkbox"
                  checked={item.completed}
                  onChange={() => toggleItemComplete(item.id)}
                />
                <div className="item-details">
                  <h4 className={item.completed ? 'completed-text' : ''}>{item.name}</h4>
                  <div className="item-meta">
                    {item.category !== 'general' && (
                      <span className="item-category">
                        <i className="fas fa-tag"></i> {item.category}
                      </span>
                    )}
                    <span className="item-quantity">
                      <i className="fas fa-hashtag"></i> Qty: {item.quantity}
                    </span>
                    {item.price && (
                      <span className="item-price">
                        <i className="fas fa-dollar-sign"></i> ${item.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-small btn-edit" onClick={() => editItem(item.id)}>
                  <i className="fas fa-edit"></i>
                </button>
                <button className="btn btn-small btn-delete" onClick={() => removeItem(item.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2><i className="fas fa-plus"></i> Add Shopping Item</h2>
              <span className="close" onClick={() => setShowAddModal(false)}>&times;</span>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="itemName">Item Name</label>
                <input
                  type="text"
                  className="form-input"
                  id="itemName"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter item name"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="itemQuantity">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    id="itemQuantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="itemCategory">Category</label>
                  <select
                    className="form-input form-select"
                    id="itemCategory"
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="general">General</option>
                    <option value="dairy">Dairy</option>
                    <option value="produce">Produce</option>
                    <option value="meat">Meat</option>
                    <option value="pantry">Pantry</option>
                    <option value="beverages">Beverages</option>
                    <option value="frozen">Frozen</option>
                    <option value="bakery">Bakery</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={addItem}>
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage; 