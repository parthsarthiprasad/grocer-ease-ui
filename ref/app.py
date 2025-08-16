import os
import json
import logging
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Configure session
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
Session(app)

# In-memory storage for user data and sessions
users_db = {}
shopping_lists = {}
chat_sessions = {}

# Import shop data
try:
    from data.shop_data import GROCERY_INVENTORY, FACE_COLORS, get_random_items
except ImportError:
    # Fallback if shop_data.py is not available
    GROCERY_INVENTORY = {"items": []}
    FACE_COLORS = {}
    def get_random_items(count=10):
        return []

class User:
    def __init__(self, username, email, password, user_type='customer'):
        self.username = username
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.user_type = user_type
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
    
    def get_id(self):
        return self.username
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @staticmethod
    def get(username):
        return users_db.get(username)
    
    @staticmethod
    def create(username, email, password, user_type='customer'):
        if username in users_db:
            return None
        user = User(username, email, password, user_type)
        users_db[username] = user
        shopping_lists[username] = []
        chat_sessions[username] = []
        return user

class ShoppingListItem:
    def __init__(self, item_id, name, quantity, image_url=None, face_id=None):
        self.item_id = item_id
        self.name = name
        self.quantity = quantity
        self.image_url = image_url or f"https://via.placeholder.com/60x60/F8F9FA/333?text={name[0]}"
        self.face_id = face_id
    
    def to_dict(self):
        return {
            'item_id': self.item_id,
            'name': self.name,
            'quantity': self.quantity,
            'image_url': self.image_url,
            'face_id': self.face_id
        }

class ChatMessage:
    def __init__(self, sender, message, timestamp=None):
        self.sender = sender  # 'user' or 'bot'
        self.message = message
        self.timestamp = timestamp or __import__('datetime').datetime.now()
    
    def to_dict(self):
        return {
            'sender': self.sender,
            'message': self.message,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }

# Routes
@app.route('/')
def index():
    if 'username' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('chatbot'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        user_type = request.form.get('user_type', 'customer')
        
        if User.get(username):
            flash('Username already exists', 'error')
            return render_template('register.html')
        
        user = User.create(username, email, password, user_type)
        if user:
            session['username'] = username
            session['user_type'] = user_type
            flash('Registration successful!', 'success')
            return redirect(url_for('chatbot'))
        else:
            flash('Registration failed', 'error')
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.get(username)
        if user and user.check_password(password):
            session['username'] = username
            session['user_type'] = user.user_type
            flash('Login successful!', 'success')
            return redirect(url_for('chatbot'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('user_type', None)
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))

@app.route('/chatbot')
def chatbot():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    user_shopping_list = shopping_lists.get(username, [])
    user_chat_history = chat_sessions.get(username, [])
    
    return render_template('chatbot.html', 
                         shopping_list=user_shopping_list,
                         chat_history=[msg.to_dict() for msg in user_chat_history],
                         user_type=session.get('user_type', 'customer'))

@app.route('/send_message', methods=['POST'])
def send_message():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    username = session['username']
    message = request.form.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'Empty message'}), 400
    
    # Initialize chat session if not exists
    if username not in chat_sessions:
        chat_sessions[username] = []
    
    # Add user message
    user_msg = ChatMessage('user', message)
    chat_sessions[username].append(user_msg)
    
    # Generate bot response (simple keyword-based responses)
    bot_response = generate_bot_response(message, username)
    bot_msg = ChatMessage('bot', bot_response)
    chat_sessions[username].append(bot_msg)
    
    return jsonify({
        'user_message': user_msg.to_dict(),
        'bot_message': bot_msg.to_dict()
    })

def generate_bot_response(message, username):
    message_lower = message.lower()
    
    # Simple keyword matching for adding items to shopping list
    if any(word in message_lower for word in ['add', 'need', 'buy', 'get']):
        # Look for items in inventory that match keywords in the message
        found_items = []
        for item in GROCERY_INVENTORY.get('items', []):
            if any(keyword in item['name'].lower() for keyword in message_lower.split()):
                found_items.append(item)
        
        if found_items:
            # Add first found item to shopping list
            item = found_items[0]
            add_to_shopping_list(username, item['id'], item['name'], 1, item.get('image_url'), item.get('face_id'))
            return f"I've added {item['name']} to your shopping list! You can find it on {item.get('face_id', 'unknown')}."
        else:
            return "I couldn't find that item in our inventory. Could you be more specific?"
    
    elif 'remove' in message_lower or 'delete' in message_lower:
        return "To remove items from your shopping list, please use the remove button next to each item."
    
    elif any(word in message_lower for word in ['help', 'what', 'how']):
        return "I can help you add items to your shopping list! Just tell me what you need, like 'I need milk' or 'add bread to my list'."
    
    elif any(word in message_lower for word in ['hello', 'hi', 'hey']):
        return "Hello! I'm here to help you with your grocery shopping. What would you like to add to your list today?"
    
    else:
        return "I'm here to help you manage your shopping list. Try saying 'add [item name]' or ask me about our products!"

def add_to_shopping_list(username, item_id, name, quantity, image_url=None, face_id=None):
    if username not in shopping_lists:
        shopping_lists[username] = []
    
    # Check if item already exists
    for item in shopping_lists[username]:
        if item.item_id == item_id:
            item.quantity += quantity
            return
    
    # Add new item
    new_item = ShoppingListItem(item_id, name, quantity, image_url, face_id)
    shopping_lists[username].append(new_item)

@app.route('/add_to_list', methods=['POST'])
def add_to_list():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    username = session['username']
    item_id = request.form.get('item_id')
    name = request.form.get('name')
    quantity = int(request.form.get('quantity', 1))
    image_url = request.form.get('image_url')
    face_id = request.form.get('face_id')
    
    add_to_shopping_list(username, item_id, name, quantity, image_url, face_id)
    
    return jsonify({'success': True})

@app.route('/remove_from_list', methods=['POST'])
def remove_from_list():
    if 'username' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    username = session['username']
    item_id = request.form.get('item_id')
    
    if username in shopping_lists:
        shopping_lists[username] = [item for item in shopping_lists[username] if item.item_id != item_id]
    
    return jsonify({'success': True})

@app.route('/floormap')
def floormap():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    
    # Auto-populate 10 random items in shopping list every time page loads
    if username not in shopping_lists:
        shopping_lists[username] = []
    
    # Clear existing list and add 10 random items
    shopping_lists[username] = []
    random_items = get_random_items(10)
    
    for item in random_items:
        new_item = ShoppingListItem(
            item_id=item['id'], 
            name=item['name'], 
            quantity=1,
            image_url=item.get('image_url'),
            face_id=item.get('face_id')
        )
        shopping_lists[username].append(new_item)
    
    user_shopping_list = shopping_lists[username]
    
    # Try to load store data, fallback to vertices.json
    try:
        with open('vertices.json', 'r') as f:
            store_data = json.load(f)
    except:
        store_data = {"store_vertices": [], "polygons": []}
    
    return render_template('floormap.html', 
                         shopping_list=user_shopping_list,
                         store_data=store_data,
                         inventory=GROCERY_INVENTORY,
                         face_colors=FACE_COLORS,
                         user_type=session.get('user_type', 'customer'))

@app.route('/upload_floormap')
def upload_floormap():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    if session.get('user_type') != 'shopkeeper':
        flash('Access denied. Shopkeeper privileges required.', 'error')
        return redirect(url_for('floormap'))
    
    return render_template('upload_floormap.html', user_type=session.get('user_type', 'customer'))

@app.route('/googlemap')
def googlemap():
    if 'username' not in session:
        return redirect(url_for('login'))
    
    return render_template('googlemap.html', user_type=session.get('user_type', 'customer'))

@app.route('/api/store_data')
def api_store_data():
    # This route would normally fetch from a database or external API
    # For now, we'll simulate a failure and use fallback data
    try:
        # Simulate API failure
        raise Exception("Store API temporarily unavailable")
    except:
        # Return fallback data from vertices.json
        try:
            with open('vertices.json', 'r') as f:
                return jsonify(json.load(f))
        except:
            return jsonify({"error": "Store data unavailable"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
