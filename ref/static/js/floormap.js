// Floormap visualization with face-based interaction (polygon edges)
class FloormapRenderer {
    constructor() {
        this.canvas = document.getElementById('store-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.storeData = null;
        this.inventory = null;
        this.shoppingList = [];
        this.showBackground = false;
        this.selectedFace = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.faces = []; // All edges from all polygons
        this.faceColors = {}; // Colors for each face based on shopping list
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.generateFaces();
        this.setupFaceColors();
        this.setupEventListeners();
        this.render();
    }
    
    loadData() {
        // Load store data from hidden script tag
        const storeDataElement = document.getElementById('store-data');
        const inventoryDataElement = document.getElementById('inventory-data');
        
        if (storeDataElement) {
            this.storeData = JSON.parse(storeDataElement.textContent);
        }
        
        if (inventoryDataElement) {
            this.inventory = JSON.parse(inventoryDataElement.textContent);
        }
        
        // Load shopping list from DOM
        this.loadShoppingList();
    }
    
    loadShoppingList() {
        const shoppingItems = document.querySelectorAll('.shopping-item');
        this.shoppingList = Array.from(shoppingItems).map(item => ({
            id: item.dataset.itemId,
            faceId: item.dataset.faceId,
            name: item.querySelector('h6').textContent
        })).filter(item => item.faceId);
    }
    
    generateFaces() {
        this.faces = [];
        let faceId = 0;
        
        // Generate faces from store boundary
        if (this.storeData.store_vertices && this.storeData.store_vertices.length > 0) {
            const vertices = this.storeData.store_vertices;
            for (let i = 0; i < vertices.length; i++) {
                const start = vertices[i];
                const end = vertices[(i + 1) % vertices.length];
                this.faces.push({
                    id: `face_${faceId:03d}`,
                    start: start,
                    end: end,
                    type: 'store_boundary',
                    polygon: null
                });
                faceId++;
            }
        }
        
        // Generate faces from inner polygons
        if (this.storeData.polygons) {
            this.storeData.polygons.forEach((polygon, polygonIndex) => {
                const vertices = polygon.polygon_vertices;
                if (vertices && vertices.length > 0) {
                    for (let i = 0; i < vertices.length; i++) {
                        const start = vertices[i];
                        const end = vertices[(i + 1) % vertices.length];
                        this.faces.push({
                            id: `face_${faceId:03d}`,
                            start: start,
                            end: end,
                            type: 'section',
                            polygon: polygonIndex
                        });
                        faceId++;
                    }
                }
            });
        }
        
        console.log(`Generated ${this.faces.length} faces`);
    }
    
    setupFaceColors() {
        // Get unique face colors from shop data
        if (window.faceColors) {
            this.faceColors = window.faceColors;
        } else {
            // Default colors for demonstration
            this.faceColors = {};
            for (let i = 0; i < this.faces.length; i++) {
                this.faceColors[`face_${i:03d}`] = this.getRandomColor();
            }
        }
        
        // Apply face colors as CSS variables for shopping list
        const style = document.createElement('style');
        let css = '';
        Object.entries(this.faceColors).forEach(([faceId, color]) => {
            css += `--face-color-${faceId}: ${color};\n`;
        });
        style.textContent = `:root { ${css} }`;
        document.head.appendChild(style);
    }
    
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
            '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#10AC84',
            '#FF3838', '#FF6348', '#FFA502', '#2ED573', '#1E90FF', '#5352ED'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    setupEventListeners() {
        // Canvas click event for face detection
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale - this.offsetX;
            const y = (e.clientY - rect.top) / this.scale - this.offsetY;
            this.handleCanvasClick(x, y);
        });
        
        // Control buttons
        document.getElementById('toggle-background')?.addEventListener('click', () => {
            this.showBackground = !this.showBackground;
            this.render();
        });
        
        document.getElementById('reset-view')?.addEventListener('click', () => {
            this.resetView();
        });
        
        // Resize handling
        window.addEventListener('resize', () => {
            this.render();
        });
    }
    
    handleCanvasClick(x, y) {
        // Find closest face (edge) to click point
        let closestFace = null;
        let closestDistance = Infinity;
        const clickThreshold = 5; // pixels - small clickable area for precise clicking
        
        this.faces.forEach(face => {
            const distance = this.distanceToLineSegment(x, y, face.start, face.end);
            if (distance < clickThreshold && distance < closestDistance) {
                closestDistance = distance;
                closestFace = face;
            }
        });
        
        if (closestFace) {
            this.selectFace(closestFace);
            this.render();
        }
    }
    
    distanceToLineSegment(px, py, start, end) {
        const [x1, y1] = start;
        const [x2, y2] = end;
        
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    selectFace(face) {
        this.selectedFace = face;
        this.displayFaceInfo(face);
    }
    
    displayFaceInfo(face) {
        const infoElement = document.getElementById('section-info');
        if (!infoElement) return;
        
        // Find inventory items for this face
        const faceItems = this.inventory?.items?.filter(item => 
            item.face_id === face.id
        ) || [];
        
        let html = `
            <div class="border-start border-primary border-3 ps-3">
                <h5 class="text-primary mb-2">${face.id}</h5>
                <p class="text-muted mb-3">Items stored on this shelf face</p>
                
                <h6 class="mb-2">Available Items:</h6>
                <div class="row">
        `;
        
        if (faceItems.length > 0) {
            faceItems.forEach(item => {
                const faceColor = this.faceColors[item.face_id] || '#6b7280';
                html += `
                    <div class="col-md-6 mb-2">
                        <div class="d-flex align-items-center">
                            <div class="me-2" style="width: 12px; height: 12px; border-radius: 50%; background-color: ${faceColor};"></div>
                            <img src="${item.image_url}" alt="${item.name}" 
                                 class="me-2" style="width: 30px; height: 30px; border-radius: 4px;">
                            <div>
                                <small class="fw-bold">${item.name}</small><br>
                                <small class="text-success">$${item.price}/${item.unit}</small>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `<p class="text-muted">No items found for this face.</p>`;
        }
        
        html += `
                </div>
            </div>
        `;
        
        infoElement.innerHTML = html;
    }
    
    render() {
        if (!this.storeData) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate bounds and scale
        this.calculateBounds();
        
        // Set transform
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(this.offsetX, this.offsetY);
        
        // Draw background if enabled
        if (this.showBackground) {
            this.drawBackground();
        }
        
        // Draw store boundary
        this.drawStoreBoundary();
        
        // Draw inner polygons (sections)
        this.drawPolygons();
        
        // Draw faces with colors for shopping list items
        this.drawFaces();
        
        // Draw shopping list markers
        this.drawShoppingListMarkers();
        
        this.ctx.restore();
    }
    
    calculateBounds() {
        if (!this.storeData.store_vertices || this.storeData.store_vertices.length === 0) {
            this.scale = 1;
            this.offsetX = 0;
            this.offsetY = 0;
            return;
        }
        
        // Find bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        this.storeData.store_vertices.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calculate scale to fit canvas
        const padding = 40;
        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;
        this.scale = Math.min(scaleX, scaleY);
        
        // Center the drawing
        this.offsetX = (this.canvas.width / this.scale - width) / 2 - minX;
        this.offsetY = (this.canvas.height / this.scale - height) / 2 - minY;
    }
    
    drawBackground() {
        // Load and draw background image if not already loaded
        if (!this.backgroundImage) {
            this.backgroundImage = new Image();
            this.backgroundImage.onload = () => {
                this.render(); // Re-render when image loads
            };
            // You can add a background image here if needed
            // this.backgroundImage.src = '/static/roomba_map.jpeg';
        }
        
        if (this.backgroundImage && this.backgroundImage.complete) {
            this.ctx.globalAlpha = 0.3;
            this.ctx.drawImage(this.backgroundImage, 0, 0);
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    drawStoreBoundary() {
        if (!this.storeData.store_vertices || this.storeData.store_vertices.length === 0) return;
        
        this.ctx.beginPath();
        const [startX, startY] = this.storeData.store_vertices[0];
        this.ctx.moveTo(startX, startY);
        
        for (let i = 1; i < this.storeData.store_vertices.length; i++) {
            const [x, y] = this.storeData.store_vertices[i];
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.strokeStyle = '#6b7280';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(107, 114, 128, 0.05)';
        this.ctx.fill();
    }
    
    drawPolygons() {
        if (!this.storeData.polygons) return;
        
        this.storeData.polygons.forEach((polygon, index) => {
            this.drawPolygon(polygon, index);
        });
    }
    
    drawPolygon(polygon, index) {
        if (!polygon.polygon_vertices || polygon.polygon_vertices.length === 0) return;
        
        this.ctx.beginPath();
        const [startX, startY] = polygon.polygon_vertices[0];
        this.ctx.moveTo(startX, startY);
        
        for (let i = 1; i < polygon.polygon_vertices.length; i++) {
            const [x, y] = polygon.polygon_vertices[i];
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        
        // Light fill for the polygon area
        this.ctx.fillStyle = 'rgba(107, 114, 128, 0.1)';
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#6b7280';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    drawFaces() {
        // Draw faces with colors if they have shopping list items
        this.faces.forEach(face => {
            const hasItems = this.shoppingList.some(item => item.faceId === face.id);
            
            if (hasItems) {
                const color = this.faceColors[face.id] || '#6b7280';
                
                this.ctx.beginPath();
                this.ctx.moveTo(face.start[0], face.start[1]);
                this.ctx.lineTo(face.end[0], face.end[1]);
                
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = face === this.selectedFace ? 6 : 4;
                this.ctx.stroke();
            } else if (face === this.selectedFace) {
                // Highlight selected face even if no items
                this.ctx.beginPath();
                this.ctx.moveTo(face.start[0], face.start[1]);
                this.ctx.lineTo(face.end[0], face.end[1]);
                
                this.ctx.strokeStyle = '#2563eb';
                this.ctx.lineWidth = 5;
                this.ctx.stroke();
            }
        });
    }
    
    drawShoppingListMarkers() {
        // Group shopping list items by face
        const itemsByFace = {};
        this.shoppingList.forEach(item => {
            if (!itemsByFace[item.faceId]) {
                itemsByFace[item.faceId] = [];
            }
            itemsByFace[item.faceId].push(item);
        });
        
        // Draw markers on faces with items
        Object.entries(itemsByFace).forEach(([faceId, items]) => {
            const face = this.faces.find(f => f.id === faceId);
            if (face) {
                const midX = (face.start[0] + face.end[0]) / 2;
                const midY = (face.start[1] + face.end[1]) / 2;
                
                const color = this.faceColors[faceId] || '#6b7280';
                
                // Draw marker
                this.ctx.beginPath();
                this.ctx.arc(midX, midY, 8, 0, 2 * Math.PI);
                this.ctx.fillStyle = color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Draw item count
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(items.length.toString(), midX, midY + 3);
            }
        });
    }
    
    resetView() {
        this.selectedFace = null;
        this.showBackground = false;
        document.getElementById('section-info').innerHTML = '<p class="text-muted">Click on a face (polygon edge) to view its details and available items.</p>';
        this.render();
    }
}

// Initialize floormap when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FloormapRenderer();
});
