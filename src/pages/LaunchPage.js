
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import chatService from '../services/chatService';
import '../styles/chatModal.css';
import imageService from '../services/imageService';
import listSync from '../services/listSync';

const storageKey = (userId) => `ge_chat_${userId}`;
const sanitizeName = (n) => (n || '').toString().trim().replace(/[\s,.;:]+$/g, '');

const LaunchPage = () => {
  const { user } = useAuth();
  const userId = user?.username || 'anonymous_user';

  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history + unified list state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(userId));
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          setMessages(saved.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    } catch (_) {}
    (async () => {
      try {
        const unified = await listSync.getUnifiedList(userId);
        setShoppingList(unified);
      } catch (_) {}
      setLoaded(true);
    })();
  }, [userId]);

  // Persist chat history whenever it changes (only after initial load)
  useEffect(() => {
    if (!loaded) return;
    try {
      const toSave = messages.map(m => ({ ...m, timestamp: m.timestamp?.toISOString?.() || new Date().toISOString() }));
      localStorage.setItem(storageKey(userId), JSON.stringify(toSave));
    } catch (_) {}
  }, [messages, userId, loaded]);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender, timestamp: new Date() }]);
  };

  const refreshUnified = async () => {
    try {
      const unified = await listSync.getUnifiedList(userId);
      setShoppingList(unified);
    } catch (_) {}
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text) return;
    addMessage(text, 'user');
    setInputMessage('');
    setIsLoading(true);
    try {
      const data = await chatService.sendMessage(userId, text);
      const bot = data?.bot_response || data?.message || 'Okay!';
      addMessage(bot, 'bot');
      await refreshUnified();
    } catch (e) {
      addMessage("Sorry, I'm having trouble connecting right now.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try { localStorage.removeItem(storageKey(userId)); } catch (_) {}
    setMessages([]);
    setShoppingList([]);
    try { await chatService.syncList(userId, []); } catch (_) {}
  };

  const removeItem = async (id) => {
    const item = shoppingList.find(i => i.id === id);
    if (!item) return;
    try {
      await listSync.syncRemoveSpecific(userId, item.name);
      await refreshUnified();
    } catch (_) {
      setShoppingList(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const updateQuantity = (id, qty) => {
    setShoppingList(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  // Resolve images for items without imageUrl using OpenFoodFacts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const updates = await Promise.all(shoppingList.map(async (it) => {
        if (it.imageUrl) return it;
        const url = await imageService.getImageForItem({ name: it.name, barcode: it.barcode });
        return { ...it, imageUrl: url };
      }));
      if (!cancelled) setShoppingList(updates);
    })();
    return () => { cancelled = true; };
  }, [shoppingList.map(i => i.id).join('|')]);

  return (
    <div className="container-fluid py-4">
      <div className="chat-container" style={{ minHeight: '70vh' }}>
        {/* Chat section */}
        <div className="chat-section">
          <div className="chat-header d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-0"><i className="fas fa-robot me-2"></i>Shopping Assistant</h1>
              <p>Ask for products or say "add [item]"</p>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={clearChat} title="Clear chat & list">
              <i className="fas fa-trash me-1"></i>Clear
            </button>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="message bot-message">
                Tip: Try messages like "Add milk and bread" or "Suggest a pasta recipe".
                <span className="message-time">Now</span>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}-message`}>
                {msg.text}
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="message bot-message"><div className="typing-indicator"><span></span><span></span><span></span></div></div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>

        {/* Shopping list section */}
        <div className="shopping-section">
          <div className="shopping-header">
            <h2 className="mb-0"><i className="fas fa-list-ul me-2"></i>Shopping List</h2>
          </div>
          <div className="shopping-content">
            {shoppingList.length === 0 ? (
              <div className="empty-list">
                <i className="fas fa-shopping-basket"></i>
                <p>Your shopping list is empty.</p>
                <small>Ask the assistant to add items!</small>
              </div>
            ) : (
              <div className="shopping-list">
                {shoppingList.map(item => (
                  <div key={item.id} className="shopping-item">
                    <div className="item-details">
                      <span className="item-name d-flex align-items-center gap-2">
                        <img src={item.imageUrl || 'https://via.placeholder.com/32'} onError={(e)=>{e.currentTarget.src='https://via.placeholder.com/32';}} alt={item.name} width={32} height={32} style={{ borderRadius: 6, objectFit: 'cover' }} />
                        {item.name}
                      </span>
                      <span className="item-category text-muted">Item</span>
                      <div className="d-flex align-items-center gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchPage;
