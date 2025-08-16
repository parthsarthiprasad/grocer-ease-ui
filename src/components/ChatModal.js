
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import '../styles/chatModal.css';

const ChatModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const userId = user?.username || 'anonymous_user';

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your smart shopping assistant. Try adding items like 'water', 'milk', or 'bread' to see the new selection options!",
      sender: 'bot',
      timestamp: new Date()
    },
    {
      id: 2,
      text: "For example: 'Add water to my shopping list'",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const state = await chatService.getShoppingListState(userId);
        const items = Array.isArray(state?.items) ? state.items : [];
        const normalized = items.filter(i => !i.removed).map((it, idx) => ({
          id: `${it.name}-${idx}`,
          name: it.name,
          quantity: it.quantity ?? 1
        }));
        setShoppingList(normalized);
      } catch (_) {}
    })();
  }, [userId]);

  const addMessage = (text, sender) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const mergeShoppingListFromApi = (apiList) => {
    if (!Array.isArray(apiList)) return;
    const merged = apiList.map((name, idx) => ({ id: `${name}-${idx}-${Date.now()}`, name, quantity: 1 }));
    setShoppingList(merged);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    addMessage(userMessage, 'user');
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userId, userMessage);
      const bot = response?.bot_response || response?.message || 'I understand. How else can I help you?';
      addMessage(bot, 'bot');
      if (response?.shopping_list) {
        mergeShoppingListFromApi(response.shopping_list);
      }
    } catch (error) {
      console.error('Chat service error:', error);
      addMessage('Sorry, I\'m having trouble connecting to the service. Please try again.', 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const updateQuantity = (id, qty) => {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (itemId) => {
    setShoppingList(prev => prev.filter(item => item.id !== itemId));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose}>&times;</button>
        
        <div className="chat-container">
          {/* Chat Section */}
          <div className="chat-section">
            <div className="chat-header">
              <h1><i className="fas fa-comments"></i> Grocer-ease Smart Shopping Assistant</h1>
              <p>Add items to your shopping list with detailed selections</p>
            </div>
            
            <div className="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}-message`}>
                  {message.text}
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="message bot-message">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to add items to your shopping list..."
                disabled={isLoading}
              />
              <button onClick={handleSendMessage} disabled={isLoading}>
                <i className="fas fa-paper-plane"></i> Send
              </button>
            </div>
          </div>
          
          {/* Shopping List Section */}
          <div className="shopping-section">
            <div className="shopping-header">
              <h2><i className="fas fa-list-check"></i> Smart Shopping List</h2>
            </div>
            
            <div className="shopping-content">
              {shoppingList.length === 0 ? (
                <div className="empty-list">
                  <i className="fas fa-shopping-cart"></i>
                  <p>Your shopping list is empty</p>
                  <small>Ask the assistant to add items!</small>
                </div>
              ) : (
                <div className="shopping-list">
                  {shoppingList.map((item) => (
                    <div key={item.id} className={`shopping-item`}>
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-category">Item</span>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <label className="text-muted small">Qty:</label>
                          <select
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                            className="form-select form-select-sm"
                            style={{ width: 80 }}
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button className="remove-item" onClick={() => removeItem(item.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="shopping-stats">
                <div><i className="fas fa-list"></i> {shoppingList.length} items</div>
                <div><i className="fas fa-cube"></i> {shoppingList.reduce((sum, item) => sum + (item.quantity || 1), 0)} units</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
