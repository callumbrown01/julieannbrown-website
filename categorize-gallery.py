#!/usr/bin/env python3
"""Auto-categorize gallery items based on dimensions"""
import json
from pathlib import Path

data_file = Path(__file__).parent / 'data' / 'gallery.json'
with open(data_file) as f:
    items = json.load(f)

for item in items:
    if 'dimensions' in item:
        w = item['dimensions']['width']
        h = item['dimensions']['height']
        if w > h:
            item['category'] = 'Landscape'
        elif h > w:
            item['category'] = 'Portrait'
        else:
            item['category'] = 'Square'
    else:
        # Default if no dimensions
        item['category'] = 'All'
    
    # Set featured flag for first item
    item['featured'] = item.get('id') == items[0].get('id') if items else False

with open(data_file, 'w') as f:
    json.dump(items, f, indent=2)

print(f"✓ Categorized {len(items)} gallery items")
