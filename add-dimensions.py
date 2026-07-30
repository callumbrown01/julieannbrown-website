#!/usr/bin/env python3
"""Add extracted dimensions to gallery and shop JSON files"""

import json
import re
from pathlib import Path

def extract_dimensions(medium_str):
    """Extract width and height from medium string like 'Oil on Canvas | 2025 | 30 x 25cm'"""
    if not medium_str:
        return None
    
    # Match pattern like "30 x 25" or "20 x 20 x 4"
    match = re.search(r'(\d+)\s*x\s*(\d+)', medium_str)
    if match:
        width = int(match.group(1))
        height = int(match.group(2))
        return {"width": width, "height": height}
    return None

def process_file(filepath):
    """Process a JSON file and add dimensions"""
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    updated = 0
    for item in data:
        medium = item.get('medium', '')
        dimensions = extract_dimensions(medium)
        if dimensions:
            item['dimensions'] = dimensions
            updated += 1
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    
    return updated

# Process both files
script_dir = Path(__file__).parent
gallery_file = script_dir / 'data' / 'gallery.json'
shop_file = script_dir / 'data' / 'shop.json'

gallery_count = process_file(gallery_file)
shop_count = process_file(shop_file)

print(f"✓ Updated gallery.json: {gallery_count} items with dimensions")
print(f"✓ Updated shop.json: {shop_count} items with dimensions")
