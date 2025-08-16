import React, { useState, useRef, useEffect } from 'react';
import './ChatPage.css';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'product-suggestion' | 'recipe' | 'shopping-tip';
  metadata?: {
    products?: Array<{ name: string; price: number; category: string }>;
    recipe?: { title: string; ingredients: string[]; instructions: string[] };
    tip?: { category: string; content: string };
  };
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your AI shopping assistant. I can help you find products, manage your shopping list, suggest recipes, and answer questions about groceries. How can I help you today?",
      role: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate contextual suggestions based on conversation
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'bot') {
      const newSuggestions = generateSuggestions(lastMessage.content);
      setSuggestions(newSuggestions);
    }
  }, [messages]);

  const generateSuggestions = (message: string): string[] => {
    const suggestions = [
      "Find organic milk under $5",
      "What ingredients do I need for pasta?",
      "Add tomatoes to my shopping list",
      "Where's the nearest grocery store?",
      "Suggest healthy breakfast options",
      "How to store fresh vegetables?",
      "Find gluten-free alternatives",
      "Compare prices for chicken breast"
    ];
    
    // Shuffle and return 4 random suggestions
    return suggestions.sort(() => 0.5 - Math.random()).slice(0, 4);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate AI response with typing indicator
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsTyping(false);
      
      const botResponse: ChatMessage = generateSmartResponse(inputMessage.trim());
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSmartResponse = (userMessage: string): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Product search responses
    if (lowerMessage.includes('milk') || lowerMessage.includes('dairy')) {
      return {
        id: (Date.now() + 1).toString(),
        content: "I found several milk options for you! Here are some great choices:",
        role: 'bot',
        timestamp: new Date(),
        type: 'product-suggestion',
        metadata: {
          products: [
            { name: 'Organic Whole Milk', price: 4.99, category: 'Dairy' },
            { name: 'Almond Milk Unsweetened', price: 3.49, category: 'Dairy Alternative' },
            { name: '2% Reduced Fat Milk', price: 3.99, category: 'Dairy' }
          ]
        }
      };
    }
    
    // Recipe responses
    if (lowerMessage.includes('pasta') || lowerMessage.includes('recipe')) {
      return {
        id: (Date.now() + 1).toString(),
        content: "Here's a simple and delicious pasta recipe for you:",
        role: 'bot',
        timestamp: new Date(),
        type: 'recipe',
        metadata: {
          recipe: {
            title: 'Classic Spaghetti Carbonara',
            ingredients: [
              '1 lb spaghetti',
              '4 large eggs',
              '1 cup grated Parmesan cheese',
              '4 slices bacon, diced',
              '2 cloves garlic, minced',
              'Salt and black pepper to taste'
            ],
            instructions: [
              'Cook spaghetti according to package directions',
              'Cook bacon until crispy, add garlic',
              'Beat eggs with cheese and pepper',
              'Toss hot pasta with egg mixture and bacon',
              'Serve immediately with extra cheese'
            ]
          }
        }
      };
    }
    
    // Shopping list responses
    if (lowerMessage.includes('add') && lowerMessage.includes('list')) {
      return {
        id: (Date.now() + 1).toString(),
        content: "Great! I've added that to your shopping list. You can view and manage your list in the Shopping List section.",
        role: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
    }
    
    // Store location responses
    if (lowerMessage.includes('store') || lowerMessage.includes('nearby')) {
      return {
        id: (Date.now() + 1).toString(),
        content: "I can help you find nearby grocery stores! Check out the Store Finder page for locations, hours, and services.",
        role: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
    }
    
    // Shopping tips
    if (lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
      return {
        id: (Date.now() + 1).toString(),
        content: "Here's a helpful shopping tip for you:",
        role: 'bot',
        timestamp: new Date(),
        type: 'shopping-tip',
        metadata: {
          tip: {
            category: 'General',
            content: 'Always make a shopping list before going to the store. This helps you stay focused, avoid impulse purchases, and ensures you don\'t forget essential items. Studies show that shoppers with lists spend 23% less time in stores and are less likely to make unplanned purchases.'
          }
        }
      };
    }
    
    // Default responses
    const defaultResponses = [
      "I can help you with that! What specific information do you need?",
      "That's a great question. Let me help you find what you're looking for.",
      "I'm here to assist with your grocery shopping needs. How can I help?",
      "Thanks for asking! I'd be happy to help you with that.",
      "That's interesting! Let me provide you with some helpful information.",
      "I understand you're looking for information about that. Let me help you find the best options.",
      "Great question! I have some helpful suggestions for you.",
      "I can definitely help you with that. Let me provide some guidance."
    ];
    
    return {
      id: (Date.now() + 1).toString(),
      content: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
      role: 'bot',
      timestamp: new Date(),
      type: 'text'
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (message: ChatMessage) => {
    switch (message.type) {
      case 'product-suggestion':
        return (
          <div className="message-content">
            <p>{message.content}</p>
            <div className="product-suggestions">
              {message.metadata?.products?.map((product, index) => (
                <div key={index} className="product-suggestion">
                  <span className="product-name">{product.name}</span>
                  <span className="product-price">${product.price}</span>
                  <span className="product-category">{product.category}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'recipe':
        return (
          <div className="message-content">
            <h4>{message.metadata?.recipe?.title}</h4>
            <div className="recipe-content">
              <div className="recipe-ingredients">
                <h5>Ingredients:</h5>
                <ul>
                  {message.metadata?.recipe?.ingredients.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              </div>
              <div className="recipe-instructions">
                <h5>Instructions:</h5>
                <ol>
                  {message.metadata?.recipe?.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        );
      
      case 'shopping-tip':
        return (
          <div className="message-content">
            <div className="tip-content">
              <h5>💡 Shopping Tip</h5>
              <p>{message.metadata?.tip?.content}</p>
            </div>
          </div>
        );
      
      default:
        return <div className="message-content">{message.content}</div>;
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1><i className="fas fa-robot"></i> AI Shopping Assistant</h1>
        <p className="text-muted">Get help with shopping decisions, recipes, and product information</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages" id="chatMessages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}-message`}>
              {renderMessageContent(message)}
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          ))}
          
          {isTyping && (
            <div className="message bot-message">
              <div className="message-content typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
              <span className="message-time">Just now</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about shopping, recipes, or products..."
            disabled={isLoading}
          />
          <button 
            className="chat-send-btn" 
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="quick-suggestions">
          <h4>Quick suggestions:</h4>
          <div className="suggestions-grid">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-btn"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Tips */}
      <div className="chat-tips">
        <h3><i className="fas fa-lightbulb"></i> Chat Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <i className="fas fa-search"></i>
            <h4>Product Search</h4>
            <p>"Find organic milk under $5"</p>
          </div>
          <div className="tip-card">
            <i className="fas fa-utensils"></i>
            <h4>Recipe Help</h4>
            <p>"What ingredients do I need for pasta?"</p>
          </div>
          <div className="tip-card">
            <i className="fas fa-list"></i>
            <h4>Shopping List</h4>
            <p>"Add tomatoes to my shopping list"</p>
          </div>
          <div className="tip-card">
            <i className="fas fa-store"></i>
            <h4>Store Info</h4>
            <p>"Where's the nearest grocery store?"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 