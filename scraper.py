#!/usr/bin/env python3
"""
Web scraper for julieannbrown.com.au
Scrapes images and product information, uploads to Cloudinary
"""

import urllib.request
import urllib.error
import json
import re
import os
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse
import time

# Configuration
CLOUDINARY_CLOUD = 'fqtug4al'
CLOUDINARY_PRESET = 'julieannbrown-website'
OLD_WEBSITE = 'https://julieannbrown.com.au'
SCRIPT_DIR = Path(__file__).parent
DOWNLOAD_DIR = SCRIPT_DIR / '.scraper-downloads'
DATA_DIR = SCRIPT_DIR / 'data'

# Ensure directories exist
DOWNLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────────────────────────
# Utility Functions
# ─────────────────────────────────────────────────────────────────

def fetch_url(url, timeout=10):
    """Fetch URL content"""
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"  ❌ Error fetching {url}: {str(e)}")
        return None

def extract_images(html, base_url):
    """Extract image URLs from HTML"""
    images = []
    # Find all img src attributes
    pattern = r'src=[\'"]([^\'"]+)[\'"]'
    matches = re.findall(pattern, html)
    
    seen = set()
    for src in matches:
        # Skip data URIs and invalid URLs
        if src.startswith('data:') or src.startswith('#'):
            continue
        
        # Convert relative URLs to absolute
        if not src.startswith('http'):
            src = urljoin(base_url, src)
        
        if src not in seen:
            images.append(src)
            seen.add(src)
    
    return images

def extract_product_info(html):
    """Extract product information from shop HTML"""
    products = []
    
    # Find product list items
    pattern = r'<li[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/li>'
    matches = re.finditer(pattern, html, re.DOTALL)
    
    for match in matches:
        product_html = match.group(1)
        
        # Extract image
        img_match = re.search(r'<img[^>]*src="([^"]+)"', product_html)
        if not img_match:
            continue
        img_src = img_match.group(1)
        
        # Skip if not a WordPress upload
        if '/wp-content/uploads/' not in img_src:
            continue
        
        # Extract title
        title_match = re.search(r'<h2[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h2>', product_html)
        title = title_match.group(1).strip() if title_match else 'Product'
        
        # Extract price
        price_match = re.search(r'<span[^>]*class="[^"]*price[^"]*"[^>]*>.*?([0-9]+(?:\.[0-9]{2})?)', product_html)
        price = float(price_match.group(1)) if price_match else None
        
        # Extract product link
        link_match = re.search(r'<a[^>]*href="([^"]+)"[^>]*class="[^"]*woocommerce[^"]*"', product_html)
        product_url = link_match.group(1) if link_match else None
        
        products.append({
            'url': img_src,
            'title': title,
            'price': price,
            'medium': None,
            'productPageUrl': product_url
        })
    
    return products

def download_file(url, filename):
    """Download file from URL"""
    try:
        filepath = DOWNLOAD_DIR / filename
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        return filepath
    except Exception as e:
        print(f"    ❌ Download failed: {str(e)}")
        return None

def upload_to_cloudinary(file_path, folder):
    """Upload file to Cloudinary using curl"""
    import subprocess
    
    try:
        cmd = [
            'curl',
            '-X', 'POST',
            '-F', f'file=@{file_path}',
            '-F', f'upload_preset={CLOUDINARY_PRESET}',
            '-F', f'folder={folder}',
            f'https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD}/image/upload'
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            return response.get('secure_url')
        else:
            print(f"    ❌ Upload failed: {result.stderr}")
            return None
    except Exception as e:
        print(f"    ❌ Upload error: {str(e)}")
        return None

# ─────────────────────────────────────────────────────────────────
# Scraping Functions
# ─────────────────────────────────────────────────────────────────

def scrape_gallery():
    """Scrape gallery images from website"""
    print('\n🎨 SCRAPING GALLERY...')
    pages = [
        f'{OLD_WEBSITE}/',
        f'{OLD_WEBSITE}/portfolio',
        f'{OLD_WEBSITE}/gallery',
    ]
    
    gallery = []
    processed = set()
    
    for page_url in pages:
        print(f"  📄 Fetching {page_url}...")
        html = fetch_url(page_url)
        if not html:
            continue
        
        images = extract_images(html, page_url)
        
        for img_src in images:
            if img_src in processed:
                continue
            processed.add(img_src)
            
            # Only include WordPress uploads
            if '/wp-content/uploads/' not in img_src:
                continue
            
            # Filter out unneeded images
            if any(x in img_src.lower() for x in ['pixel', 'favicon', 'icon', 'logo', 'shopping-bag', '.svg']):
                continue
            
            title = os.path.basename(img_src).split('.')[0]
            gallery.append({
                'url': img_src,
                'title': title,
                'category': 'Landscape'
            })
    
    print(f"  ✓ Found {len(gallery)} gallery images")
    return gallery

def scrape_shop():
    """Scrape shop products from website"""
    print('\n🛍️  SCRAPING SHOP...')
    page_url = f'{OLD_WEBSITE}/shop'
    
    print(f"  📄 Fetching {page_url}...")
    html = fetch_url(page_url)
    if not html:
        return []
    
    products = extract_product_info(html)
    print(f"  ✓ Found {len(products)} shop products")
    
    # Fetch product pages for details
    if products:
        print(f'\n  📖 Fetching details for products...')
        for i, product in enumerate(products):
            if not product['productPageUrl']:
                continue
            
            print(f"    [{i+1}/{len(products)}] {product['title']}...")
            product_html = fetch_url(product['productPageUrl'])
            
            if product_html:
                # Try to extract medium from product description
                medium_match = re.search(r'<p[^>]*>.*?(?:Medium|Material):\s*([^<]+)<\/p>', product_html, re.IGNORECASE)
                if medium_match:
                    product['medium'] = medium_match.group(1).strip()
                
                # Look for medium keywords in description
                if not product['medium']:
                    desc_match = re.search(r'<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>', product_html, re.DOTALL)
                    if desc_match:
                        text = re.sub(r'<[^>]+>', ' ', desc_match.group(1)).strip()[:200]
                        if any(x in text.lower() for x in ['oil', 'acrylic', 'watercolor', 'canvas', 'paper', 'mixed']):
                            product['medium'] = text
            
            time.sleep(0.5)  # Rate limit
    
    return products

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

def main():
    print('🚀 Starting julieannbrown.com.au scraper...')
    
    try:
        # Check if curl is available
        import subprocess
        subprocess.run(['curl', '--version'], capture_output=True, check=True)
    except:
        print('❌ curl is required but not found. Please install curl.')
        sys.exit(1)
    
    gallery = scrape_gallery()
    shop = scrape_shop()
    
    if gallery is None:
        gallery = []
    if shop is None:
        shop = []
    
    print(f'\n✅ Found {len(gallery)} gallery images')
    print(f'✅ Found {len(shop)} shop products')
    
    if len(gallery) == 0 and len(shop) == 0:
        print('\n⚠️  No content found. Please check the website structure.')
        sys.exit(1)
    
    # Download and upload images
    print('\n📥 Downloading and uploading images...')
    
    gallery_data = []
    for i, item in enumerate(gallery):
        try:
            print(f'  [{i+1}/{len(gallery)}] {item["title"][:50]}...')
            
            # Download
            ext = os.path.splitext(urlparse(item['url']).path)[1] or '.jpg'
            filename = f'gallery-{i}{ext}'
            file_path = download_file(item['url'], filename)
            
            if file_path:
                print(f'    ✓ Downloaded')
                
                # Upload
                print(f'    ⏳ Uploading to Cloudinary...')
                cloudinary_url = upload_to_cloudinary(file_path, 'gallery')
                
                if cloudinary_url:
                    print(f'    ✓ Uploaded')
                    gallery_data.append({
                        'id': f'g{int(time.time() * 1000) + i}',
                        'title': item['title'],
                        'src': cloudinary_url,
                        'category': item['category'],
                        'featured': i == 0
                    })
                    os.remove(file_path)
                    time.sleep(1)
        except Exception as e:
            print(f'    ❌ Error: {str(e)}')
    
    shop_data = []
    for i, item in enumerate(shop):
        try:
            print(f'  [{i+1}/{len(shop)}] {item["title"][:50]}...')
            
            # Download
            ext = os.path.splitext(urlparse(item['url']).path)[1] or '.jpg'
            filename = f'shop-{i}{ext}'
            file_path = download_file(item['url'], filename)
            
            if file_path:
                print(f'    ✓ Downloaded')
                
                # Upload
                print(f'    ⏳ Uploading to Cloudinary...')
                cloudinary_url = upload_to_cloudinary(file_path, 'shop')
                
                if cloudinary_url:
                    print(f'    ✓ Uploaded')
                    shop_data.append({
                        'id': f's{int(time.time() * 1000) + i}',
                        'title': item['title'],
                        'src': cloudinary_url,
                        'price': item['price'] or 0,
                        'medium': item['medium'] or '',
                        'sold': False,
                        'stripeLink': '',
                        'order': i
                    })
                    os.remove(file_path)
                    time.sleep(1)
        except Exception as e:
            print(f'    ❌ Error: {str(e)}')
    
    # Save data files
    print('\n💾 Saving data files...')
    with open(DATA_DIR / 'gallery.json', 'w') as f:
        json.dump(gallery_data, f, indent=2)
    print('✓ Saved data/gallery.json')
    
    with open(DATA_DIR / 'shop.json', 'w') as f:
        json.dump(shop_data, f, indent=2)
    print('✓ Saved data/shop.json')
    
    # Cleanup
    print('\n🧹 Cleaning up...')
    import shutil
    if DOWNLOAD_DIR.exists():
        shutil.rmtree(DOWNLOAD_DIR)
    
    print('\n✨ Done! Your website has been updated with:')
    print(f'   • {len(gallery_data)} gallery images')
    print(f'   • {len(shop_data)} shop products')
    print('\n📋 Next steps:')
    print('   1. Review data/gallery.json and data/shop.json')
    print('   2. Add missing product details (prices, mediums, stripe links)')
    print('   3. Commit changes to GitHub')

if __name__ == '__main__':
    main()
