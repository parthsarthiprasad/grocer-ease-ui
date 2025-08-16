
import React, { useEffect, useRef, useState } from 'react';
import chatService from '../services/chatService';
import '../styles/chatModal.css';

const LaunchPage = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your smart shopping assistant. Ask me to add items like 'milk' or 'bread'!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender, timestamp: new Date() }]);
  };

  const addToShoppingList = (item) => {
    const newItem = {
      id: Date.now(),
      name: item.name || item,
      category: item.category || 'General',
      quantity: item.quantity || 1
    };
    setShoppingList(prev => [newItem, ...prev]);
  };

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text) return;
    addMessage(text, 'user');
    setInputMessage('');
    setIsLoading(true);
    try {
      const response = await chatService.sendMessage(text);
      if (response?.products?.length) {
        response.products.forEach(addToShoppingList);
        addMessage(`Added ${response.products.length} item(s) to your list.`, 'bot');
      } else if (response?.item) {
        addToShoppingList(response.item);
        addMessage(`Added "${response.item.name || response.item}" to your list.`, 'bot');
      } else {
        addMessage(response.message || response.response || 'Okay!', 'bot');
      }
    } catch (e) {
      addMessage("Sorry, I'm having trouble connecting right now.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="chat-container" style={{ minHeight: '70vh' }}>
        {/* Chat section */}
        <div className="chat-section">
          <div className="chat-header">
            <h1 className="mb-0"><i className="fas fa-robot me-2"></i>Shopping Assistant</h1>
            <p>Ask for products or say "add [item]"</p>
          </div>
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}-message`}>
                {msg.text}
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <span className="item-name">{item.name}</span>
                      <span className="item-category text-muted">{item.category}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                    <button className="remove-item" onClick={() => setShoppingList(prev => prev.filter(i => i.id !== item.id))}>
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
