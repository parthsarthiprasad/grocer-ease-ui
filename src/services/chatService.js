
const API_BASE = (process.env.REACT_APP_CHAT_API_BASE_URL || 'http://localhost:8000') + '/api/v1';

class ChatService {
  async sendMessage(userId, userMessage) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_message: userMessage })
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    return res.json(); // { bot_response, shopping_list, preferences }
  }

  async getShoppingListState(userId) {
    const res = await fetch(`${API_BASE}/shopping-list/state/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`List state failed: ${res.status}`);
    return res.json(); // { items: [{ name, quantity, unit, removed, ... }], ... }
  }

  async getItemsOnly(userId) {
    const res = await fetch(`${API_BASE}/shopping-list/items/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Items-only failed: ${res.status}`);
    return res.json(); // { items: ["milk", ...] }
  }

  async syncList(userId, items) {
    const res = await fetch(`${API_BASE}/shopping-list/sync`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, items })
    });
    if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
    return res.json(); // { success, items, added, removed }
  }

  async getPreferences(userId) {
    const res = await fetch(`${API_BASE}/preferences/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Get prefs failed: ${res.status}`);
    return res.json();
  }

  async setEnhancedPreferences(payload) {
    const res = await fetch(`${API_BASE}/preferences/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Set enhanced prefs failed: ${res.status}`);
    return res.json();
  }

  async suggestRecipe(userId, recipeQuery) {
    const res = await fetch(`${API_BASE}/recipe/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, recipe_query: recipeQuery })
    });
    if (!res.ok) throw new Error(`Suggest recipe failed: ${res.status}`);
    return res.json();
  }

  async getContext(userId) {
    const res = await fetch(`${API_BASE}/context/${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`Get context failed: ${res.status}`);
    return res.json();
  }
}

export default new ChatService();
