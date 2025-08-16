#!/usr/bin/env python3
"""
Convert CSV inventory data to Python data structure
for grocer-ease application
"""

import csv
import json

def convert_csv_to_python():
    """Convert CSV inventory to Python data structure"""
    
    # Read CSV data
    inventory = []
    with open('data/shop_inventory.csv', 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            inventory.append({
                "id": row['item_id'],
                "name": row['name'],
                "barcode": row['barcode'],
                "face_id": row['face_id'],
                "description": row['description'],
                "price": float(row['price']),
                "unit": row['unit'],
                "category": row['category'],
                "brand": row['brand'],
                "image_url": row['image_url']
            })
    
    # Generate face colors for all 122 faces
    face_colors = {}
    colors = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
        "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
        "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43", "#10AC84",
        "#FF3838", "#FF6348", "#FFA502", "#2ED573", "#1E90FF", "#5352ED",
        "#3742FA", "#2F3542", "#747D8C", "#A4B0BE", "#57606F", "#2F3542",
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
        "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
        "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43", "#10AC84",
        "#FF3838", "#FF6348", "#FFA502", "#2ED573", "#1E90FF", "#5352ED",
        "#3742FA", "#2F3542", "#747D8C", "#A4B0BE", "#57606F", "#2F3542",
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
        "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
        "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43", "#10AC84",
        "#FF3838", "#FF6348", "#FFA502", "#2ED573", "#1E90FF", "#5352ED",
        "#3742FA", "#2F3542", "#747D8C", "#A4B0BE", "#57606F", "#2F3542",
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD",
        "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
        "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43", "#10AC84",
        "#FF3838", "#FF6348", "#FFA502", "#2ED573", "#1E90FF", "#5352ED",
        "#3742FA", "#2F3542", "#747D8C", "#A4B0BE", "#57606F", "#2F3542"
    ]
    
    for i in range(122):
        face_colors[f"face_{i:03d}"] = colors[i % len(colors)]
    
    # Create the data structure
    data = {
        "items": inventory,
        "face_colors": face_colors
    }
    
    # Save as Python file
    with open('data/shop_data.py', 'w', encoding='utf-8') as f:
        f.write("# Real-world grocery inventory data with comprehensive face mappings\n")
        f.write("# Each face represents an edge of a polygon (line between two vertices)\n\n")
        f.write("GROCERY_INVENTORY = ")
        f.write(json.dumps(data, indent=2, ensure_ascii=False))
        f.write("\n\n")
        
        # Add utility functions
        f.write("""
def get_items_by_face_id(face_id):
    \"\"\"Get all items stored on a specific face/edge\"\"\"
    return [item for item in GROCERY_INVENTORY["items"] if item["face_id"] == face_id]

def get_item_by_name(item_name):
    \"\"\"Get item details by name\"\"\"
    for item in GROCERY_INVENTORY["items"]:
        if item["name"].lower() == item_name.lower():
            return item
    return None

def get_item_by_id(item_id):
    \"\"\"Get item details by ID\"\"\"
    for item in GROCERY_INVENTORY["items"]:
        if item["id"] == item_id:
            return item
    return None

def search_items(query):
    \"\"\"Search for items by name or description\"\"\"
    query = query.lower()
    results = []
    for item in GROCERY_INVENTORY["items"]:
        if query in item["name"].lower() or query in item["description"].lower():
            results.append(item)
    return results

def get_unique_face_ids():
    \"\"\"Get all unique face IDs that have items\"\"\"
    return list(set(item["face_id"] for item in GROCERY_INVENTORY["items"]))

def get_face_color(face_id):
    \"\"\"Get the color associated with a face\"\"\"
    return GROCERY_INVENTORY["face_colors"].get(face_id, "#6b7280")

def get_random_items(count=10):
    \"\"\"Get random items from inventory for shopping list\"\"\"
    import random
    return random.sample(GROCERY_INVENTORY["items"], min(count, len(GROCERY_INVENTORY["items"])))

# Convenience access to face colors
FACE_COLORS = GROCERY_INVENTORY["face_colors"]
""")
    
    print(f"Converted {len(inventory)} items to Python data structure")
    print("Saved to data/shop_data.py")
    
    # Print summary
    face_counts = {}
    for item in inventory:
        face_id = item['face_id']
        face_counts[face_id] = face_counts.get(face_id, 0) + 1
    
    print(f"\nItems per face summary:")
    for face_id in sorted(face_counts.keys()):
        print(f"{face_id}: {face_counts[face_id]} items")
    
    print(f"\nTotal unique faces: {len(face_counts)}")
    print(f"Average items per face: {len(inventory) / len(face_counts):.1f}")

if __name__ == "__main__":
    convert_csv_to_python()
