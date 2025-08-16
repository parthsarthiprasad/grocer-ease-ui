#!/usr/bin/env python3
"""
Grocery Store Inventory Generator
Creates a comprehensive dataset with 20+ unique items per face
Based on vertices_1755306548932.json structure
"""

import csv
import random

# Real grocery store categories and items
GROCERY_CATEGORIES = {
    "produce": {
        "fruits": [
            "Gala Apples", "Red Delicious Apples", "Granny Smith Apples", "Fuji Apples",
            "Bananas", "Organic Bananas", "Plantains", "Cavendish Bananas",
            "Navel Oranges", "Valencia Oranges", "Blood Oranges", "Clementines",
            "Red Grapes", "Green Grapes", "Black Grapes", "Cotton Candy Grapes",
            "Strawberries", "Blueberries", "Raspberries", "Blackberries",
            "Pineapple", "Mango", "Papaya", "Kiwi", "Dragon Fruit"
        ],
        "vegetables": [
            "Roma Tomatoes", "Beefsteak Tomatoes", "Cherry Tomatoes", "Grape Tomatoes",
            "Baby Carrots", "Regular Carrots", "Purple Carrots", "Rainbow Carrots",
            "Iceberg Lettuce", "Romaine Lettuce", "Butter Lettuce", "Red Leaf Lettuce",
            "English Cucumbers", "Persian Cucumbers", "Pickling Cucumbers", "Armenian Cucumbers",
            "Russet Potatoes", "Red Potatoes", "Yukon Gold Potatoes", "Sweet Potatoes",
            "Yellow Onions", "Red Onions", "White Onions", "Shallots", "Garlic"
        ],
        "leafy_greens": [
            "Baby Spinach", "Kale", "Arugula", "Swiss Chard", "Collard Greens",
            "Mustard Greens", "Bok Choy", "Napa Cabbage", "Green Cabbage", "Red Cabbage",
            "Fresh Cilantro", "Fresh Parsley", "Fresh Basil", "Fresh Mint", "Fresh Rosemary",
            "Fresh Thyme", "Fresh Sage", "Fresh Oregano", "Fresh Dill", "Fresh Chives"
        ]
    },
    "dairy": {
        "milk": [
            "Whole Milk", "2% Reduced Fat Milk", "1% Low Fat Milk", "Skim Milk",
            "Organic Whole Milk", "Organic 2% Milk", "Lactose Free Milk", "Almond Milk",
            "Soy Milk", "Oat Milk", "Coconut Milk", "Cashew Milk", "Hemp Milk"
        ],
        "cheese": [
            "Sharp Cheddar Cheese", "Mild Cheddar Cheese", "White Cheddar Cheese",
            "Mozzarella Cheese", "Provolone Cheese", "Swiss Cheese", "Gouda Cheese",
            "Brie Cheese", "Blue Cheese", "Feta Cheese", "Parmesan Cheese", "Ricotta Cheese",
            "Cottage Cheese", "Cream Cheese", "String Cheese", "Colby Jack Cheese"
        ],
        "yogurt": [
            "Plain Greek Yogurt", "Vanilla Greek Yogurt", "Strawberry Greek Yogurt",
            "Blueberry Greek Yogurt", "Honey Greek Yogurt", "Coconut Greek Yogurt",
            "Regular Plain Yogurt", "Regular Vanilla Yogurt", "Regular Strawberry Yogurt",
            "Kids Yogurt Tubes", "Yogurt Cups", "Yogurt Drinks"
        ],
        "eggs_cream": [
            "Large Eggs", "Extra Large Eggs", "Jumbo Eggs", "Organic Eggs",
            "Cage Free Eggs", "Free Range Eggs", "Egg Whites", "Liquid Eggs",
            "Heavy Cream", "Light Cream", "Half and Half", "Whipping Cream",
            "Sour Cream", "Buttermilk", "Evaporated Milk", "Condensed Milk"
        ]
    },
    "meat": {
        "chicken": [
            "Boneless Chicken Breast", "Bone-in Chicken Breast", "Chicken Thighs",
            "Chicken Drumsticks", "Chicken Wings", "Ground Chicken", "Chicken Tenders",
            "Chicken Cutlets", "Whole Chicken", "Rotisserie Chicken", "Chicken Sausage",
            "Chicken Hot Dogs", "Chicken Nuggets", "Chicken Patties"
        ],
        "beef": [
            "Ground Beef 80/20", "Ground Beef 90/10", "Ground Beef 93/7",
            "Ground Beef 95/5", "Ribeye Steak", "T-Bone Steak", "Porterhouse Steak",
            "Filet Mignon", "Strip Steak", "Flank Steak", "Skirt Steak", "Brisket",
            "Chuck Roast", "Round Roast", "Beef Short Ribs", "Beef Stew Meat"
        ],
        "pork": [
            "Pork Chops", "Pork Tenderloin", "Pork Loin", "Pork Shoulder",
            "Pork Belly", "Bacon", "Ham", "Pork Sausage", "Italian Sausage",
            "Bratwurst", "Kielbasa", "Andouille Sausage", "Ground Pork"
        ],
        "seafood": [
            "Atlantic Salmon", "Pacific Salmon", "Wild Salmon", "Farmed Salmon",
            "Cod Fillets", "Haddock Fillets", "Tilapia Fillets", "Mahi Mahi",
            "Tuna Steaks", "Swordfish", "Halibut", "Sea Bass", "Red Snapper",
            "Large Shrimp", "Medium Shrimp", "Small Shrimp", "Scallops", "Mussels"
        ]
    },
    "bakery": {
        "bread": [
            "Whole Wheat Bread", "White Bread", "Multigrain Bread", "Sourdough Bread",
            "Rye Bread", "Pumpernickel Bread", "Italian Bread", "French Bread",
            "Brioche Bread", "Challah Bread", "Pita Bread", "Naan Bread",
            "Tortillas", "Flatbread", "Bagels", "English Muffins", "Hamburger Buns",
            "Hot Dog Buns", "Dinner Rolls", "Croissants", "Danish Pastries"
        ],
        "desserts": [
            "Chocolate Chip Cookies", "Sugar Cookies", "Oatmeal Cookies", "Peanut Butter Cookies",
            "Brownies", "Cupcakes", "Muffins", "Donuts", "Cakes", "Pies",
            "Cheesecake", "Tiramisu", "Cannoli", "Eclairs", "Macarons"
        ]
    },
    "pantry": {
        "canned_goods": [
            "Canned Tomatoes", "Canned Beans", "Canned Corn", "Canned Peas",
            "Canned Carrots", "Canned Green Beans", "Canned Mushrooms", "Canned Tuna",
            "Canned Salmon", "Canned Chicken", "Canned Soup", "Canned Vegetables"
        ],
        "dry_goods": [
            "White Rice", "Brown Rice", "Basmati Rice", "Jasmine Rice",
            "Quinoa", "Couscous", "Pasta", "Spaghetti", "Penne", "Rigatoni",
            "Lentils", "Chickpeas", "Black Beans", "Kidney Beans", "Pinto Beans"
        ],
        "condiments": [
            "Ketchup", "Mustard", "Mayonnaise", "Hot Sauce", "Soy Sauce",
            "Worcestershire Sauce", "Vinegar", "Olive Oil", "Vegetable Oil",
            "Honey", "Maple Syrup", "Jam", "Jelly", "Peanut Butter"
        ]
    }
}

# Real barcode prefixes for different categories
BARCODE_PREFIXES = {
    "produce": ["4", "5", "6", "7", "8", "9"],  # PLU codes
    "dairy": ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    "meat": ["20", "21", "22", "23", "24", "25", "26", "27", "28", "29"],
    "bakery": ["07", "08", "09", "10", "11", "12", "13", "14", "15", "16"],
    "pantry": ["30", "31", "32", "33", "34", "35", "36", "37", "38", "39"]
}

# Real brand names
BRANDS = {
    "produce": ["Fresh Harvest", "Local Farm", "Organic Valley", "Earthbound Farm", "Driscoll's", "Chiquita", "Dole", "Del Monte"],
    "dairy": ["Great Value", "Horizon Organic", "Organic Valley", "Tillamook", "Land O'Lakes", "Kraft", "Philadelphia", "Daisy", "Fage", "Chobani"],
    "meat": ["Tyson", "Perdue", "Butterball", "Smithfield", "Johnsonville", "Oscar Mayer", "Hillshire Farm", "Boar's Head", "Fresh Market"],
    "bakery": ["Sara Lee", "Thomas'", "King's Hawaiian", "Pepperidge Farm", "La Brea", "Bakery Fresh", "Bakery Select", "Wonder Bread"],
    "pantry": ["Great Value", "Kraft", "Heinz", "Hunt's", "Del Monte", "Campbell's", "Progresso", "Bush's", "Goya", "Uncle Ben's"]
}

def generate_barcode(category):
    """Generate realistic barcode based on category"""
    prefix = random.choice(BARCODE_PREFIXES[category])
    if category == "produce":
        # PLU codes are 4-5 digits
        return prefix + str(random.randint(100, 999))
    else:
        # UPC codes are 12 digits
        return prefix + str(random.randint(100000000, 999999999))

def generate_price(category, item_name):
    """Generate realistic price based on category and item"""
    base_prices = {
        "produce": {"fruits": (0.50, 4.99), "vegetables": (0.30, 3.99), "leafy_greens": (0.99, 4.99)},
        "dairy": {"milk": (2.99, 5.99), "cheese": (2.99, 8.99), "yogurt": (3.99, 6.99), "eggs_cream": (1.99, 4.99)},
        "meat": {"chicken": (2.99, 8.99), "beef": (4.99, 19.99), "pork": (3.99, 12.99), "seafood": (8.99, 24.99)},
        "bakery": {"bread": (1.99, 4.99), "desserts": (2.99, 8.99)},
        "pantry": {"canned_goods": (0.99, 3.99), "dry_goods": (1.99, 6.99), "condiments": (1.99, 5.99)}
    }
    
    # Find the subcategory
    for subcat, items in GROCERY_CATEGORIES[category].items():
        if item_name in items:
            min_price, max_price = base_prices[category][subcat]
            return round(random.uniform(min_price, max_price), 2)
    
    return round(random.uniform(1.99, 9.99), 2)

def generate_description(category, item_name):
    """Generate realistic description"""
    descriptions = {
        "produce": f"Fresh {item_name.lower()}, premium quality",
        "dairy": f"Premium {item_name.lower()}, great taste and quality",
        "meat": f"Fresh {item_name.lower()}, USDA inspected",
        "bakery": f"Fresh baked {item_name.lower()}, made daily",
        "pantry": f"High quality {item_name.lower()}, long shelf life"
    }
    return descriptions.get(category, f"Premium {item_name.lower()}")

def generate_inventory_dataset():
    """Generate comprehensive inventory dataset"""
    inventory = []
    face_id = 0
    
    # Generate items for each face
    for face_id in range(122):  # Total faces from vertices.json
        # Determine category for this face (distribute evenly)
        category = list(GROCERY_CATEGORIES.keys())[face_id % len(GROCERY_CATEGORIES)]
        
        # Get subcategories for this category
        subcategories = list(GROCERY_CATEGORIES[category].keys())
        subcategory = subcategories[face_id % len(subcategories)]
        
        # Get items for this subcategory
        items = GROCERY_CATEGORIES[category][subcategory]
        
        # Generate 20+ unique items for this face
        items_for_face = random.sample(items, min(25, len(items)))
        
        for item_name in items_for_face:
            # Generate unique item ID
            item_id = f"{category[:3]}_{face_id:03d}_{random.randint(1000, 9999)}"
            
            # Generate barcode
            barcode = generate_barcode(category)
            
            # Generate price
            price = generate_price(category, item_name)
            
            # Generate description
            description = generate_description(category, item_name)
            
            # Generate image URL (placeholder with emoji)
            emoji_map = {
                "Apple": "🍎", "Banana": "🍌", "Orange": "🍊", "Grape": "🍇",
                "Tomato": "🍅", "Carrot": "🥕", "Lettuce": "🥬", "Cucumber": "🥒",
                "Potato": "🥔", "Onion": "🧅", "Bell Pepper": "🫑", "Broccoli": "🥦",
                "Spinach": "🥬", "Cilantro": "🌿", "Parsley": "🌿", "Basil": "🌿",
                "Milk": "🥛", "Cheese": "🧀", "Butter": "🧈", "Egg": "🥚",
                "Chicken": "🍗", "Beef": "🥩", "Pork": "🥓", "Salmon": "🐟",
                "Shrimp": "🦐", "Bread": "🍞", "Muffin": "🧁", "Cookie": "🍪",
                "Rice": "🍚", "Pasta": "🍝", "Bean": "🫘", "Soup": "🥣"
            }
            
            emoji = "🛒"  # Default emoji
            for key, value in emoji_map.items():
                if key.lower() in item_name.lower():
                    emoji = value
                    break
            
            image_url = f"https://via.placeholder.com/60x60/F8F9FA/333?text={emoji}"
            
            inventory.append({
                "item_id": item_id,
                "name": item_name,
                "barcode": barcode,
                "face_id": f"face_{face_id:03d}",
                "description": description,
                "price": price,
                "unit": "lb" if "meat" in category or "produce" in category else "each",
                "category": category.title(),
                "brand": random.choice(BRANDS[category]),
                "image_url": image_url
            })
    
    return inventory

def main():
    """Main function to generate and save inventory dataset"""
    print("Generating comprehensive grocery inventory dataset...")
    
    # Generate inventory
    inventory = generate_inventory_dataset()
    
    # Save to CSV
    csv_filename = "shop_inventory.csv"
    fieldnames = ["item_id", "name", "barcode", "face_id", "description", "price", "unit", "category", "brand", "image_url"]
    
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(inventory)
    
    print(f"Generated {len(inventory)} items across 122 faces")
    print(f"Saved to {csv_filename}")
    
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
    main()
