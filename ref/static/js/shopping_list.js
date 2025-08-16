// Shopping list functionality
class ShoppingListManager {
    constructor() {
        this.listContainer = document.getElementById('shopping-list');
        this.listCount = document.getElementById('list-count');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateCount();
    }
    
    setupEventListeners() {
        // Remove item buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item')) {
                const button = e.target.closest('.remove-item');
                const itemId = button.dataset.itemId;
                this.removeItem(itemId);
            }
        });
        
        // Add item form (if exists)
        const addForm = document.getElementById('add-item-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addItem();
            });
        }
    }
    
    async removeItem(itemId) {
        try {
            const formData = new FormData();
            formData.append('item_id', itemId);
            
            const response = await fetch('/remove_from_list', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                this.removeItemFromDOM(itemId);
                this.updateCount();
                this.showMessage('Item removed from list', 'success');
            } else {
                this.showMessage('Failed to remove item', 'error');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            this.showMessage('Error removing item', 'error');
        }
    }
    
    async addItem() {
        const form = document.getElementById('add-item-form');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/add_to_list', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                // Reload page to show updated list
                window.location.reload();
            } else {
                this.showMessage('Failed to add item', 'error');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            this.showMessage('Error adding item', 'error');
        }
    }
    
    removeItemFromDOM(itemId) {
        const item = document.querySelector(`[data-item-id="${itemId}"]`);
        if (item) {
            item.remove();
            
            // Show empty state if no items left
            const remainingItems = document.querySelectorAll('.shopping-item');
            if (remainingItems.length === 0) {
                this.showEmptyState();
            }
        }
    }
    
    showEmptyState() {
        if (this.listContainer) {
            this.listContainer.innerHTML = `
                <div class="text-center text-muted" id="empty-list">
                    <i class="fas fa-shopping-basket fa-3x mb-3"></i>
                    <p>Your shopping list is empty.</p>
                    <p class="small">Ask the assistant to add items!</p>
                </div>
            `;
        }
    }
    
    updateCount() {
        const items = document.querySelectorAll('.shopping-item');
        if (this.listCount) {
            this.listCount.textContent = items.length;
        }
    }
    
    showMessage(message, type) {
        // Create a temporary alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of page
        const container = document.querySelector('.container, .container-fluid');
        if (container) {
            container.insertBefore(alert, container.firstChild);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 3000);
        }
    }
}

// Initialize shopping list manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ShoppingListManager();
});
