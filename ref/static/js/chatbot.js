// Chatbot functionality
class ChatbotInterface {
    constructor() {
        this.chatForm = document.getElementById('chat-form');
        this.messageInput = document.getElementById('message-input');
        this.messagesContainer = document.getElementById('chat-messages');
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.scrollToBottom();
    }
    
    setupEventListeners() {
        if (this.chatForm) {
            this.chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendMessage();
            });
        }
        
        // Auto-resize input
        if (this.messageInput) {
            this.messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;
        
        this.isLoading = true;
        this.addMessage('user', message);
        this.messageInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const formData = new FormData();
            formData.append('message', message);
            
            const response = await fetch('/send_message', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.hideTypingIndicator();
                this.addMessage('bot', data.bot_message.message);
                
                // Refresh shopping list if item was added
                if (data.bot_message.message.includes("I've added")) {
                    this.refreshShoppingList();
                }
            } else {
                this.hideTypingIndicator();
                this.addMessage('bot', 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('bot', 'Sorry, I cannot connect to the server right now.');
            console.error('Chat error:', error);
        }
        
        this.isLoading = false;
    }
    
    addMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString();
        const senderName = sender === 'user' ? 'You' : 'Assistant';
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <strong>${senderName}:</strong> ${this.escapeHtml(message)}
            </div>
            <small class="text-muted">${timestamp}</small>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <strong>Assistant:</strong> <span class="loading"></span> Typing...
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = this.messagesContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    refreshShoppingList() {
        // Reload the page to refresh shopping list
        // In a real app, you'd update the list dynamically
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatbotInterface();
});
