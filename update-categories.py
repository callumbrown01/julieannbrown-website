#!/usr/bin/env python3
"""Update gallery categories to new set"""
import json
from pathlib import Path

data_file = Path(__file__).parent / 'data' / 'gallery.json'
with open(data_file) as f:
    items = json.load(f)

# Category mapping
valid_categories = ['Landscape', 'Portrait', 'Creatures', 'Waterwork', 'Still Life']

for item in items:
    current_cat = item.get('category', 'Landscape')
    
    # Parse existing categories if they contain multiple
    if ',' in current_cat:
        parts = [c.strip() for c in current_cat.split(',')]
        # Use first valid category found, default to Landscape
        item['category'] = next((c for c in parts if c in valid_categories), 'Landscape')
    elif current_cat == 'All':
        item['category'] = 'Landscape'
    else:
        # Validate and keep if valid, otherwise default to Landscape
        item['category'] = current_cat if current_cat in valid_categories else 'Landscape'

with open(data_file, 'w') as f:
    json.dump(items, f, indent=2)

# Count categories
from collections import Counter
cats = Counter(item['category'] for item in items)
print("✓ Updated gallery categories:")
for cat, count in sorted(cats.items()):
    print(f"  {cat}: {count}")
print(f"\n✓ Total: {len(items)} items")
