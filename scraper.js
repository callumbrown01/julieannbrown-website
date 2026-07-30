#!/usr/bin/env node
/**
 * Web Scraper for julieannbrown.com.au
 * Scrapes images and product information, uploads to Cloudinary
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const CLOUDINARY_CLOUD = 'fqtug4al';
const CLOUDINARY_PRESET = 'julieannbrown-website';
const OLD_WEBSITE = 'https://julieannbrown.com.au';
const DOWNLOAD_DIR = path.join(__dirname, '.scraper-downloads');

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ─────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeoutMs = 10000;
    
    const req = protocol.get(url, { 
      timeout: timeoutMs,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${url}`));
    });
  });
}

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const filepath = path.join(DOWNLOAD_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    const req = protocol.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    });
    
    req.on('error', () => {
      fs.unlink(filepath, () => {});
      reject(new Error(`Failed to download ${url}`));
    });
    file.on('error', reject);
  });
}

async function uploadToCloudinary(filePath, folder) {
  const FormData = require('form-data');
  const fs = require('fs');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('upload_preset', CLOUDINARY_PRESET);
  form.append('folder', folder);
  
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`;
    const request = https.request(url, {
      method: 'POST',
      headers: form.getHeaders(),
      timeout: 30000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.secure_url);
        } catch (e) {
          reject(new Error(`Invalid response from Cloudinary: ${data}`));
        }
      });
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Upload timeout'));
    });
    
    form.pipe(request);
  });
}

// ─────────────────────────────────────────────────────────────────
// HTML Parsing
// ─────────────────────────────────────────────────────────────────

function extractImageSrc(html, baseUrl) {
  const regex = /<img[^>]*src=['"]([^'"]+)['"]/gi;
  const images = [];
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    let src = match[1];
    
    // Skip data URIs and invalid URLs
    if (src.startsWith('data:') || src.startsWith('#')) continue;
    
    // Convert relative URLs to absolute
    if (!src.startsWith('http')) {
      src = new URL(src, baseUrl).href;
    }
    
    images.push(src);
  }
  
  return [...new Set(images)]; // Remove duplicates
}

function extractImageAlt(html) {
  const alts = {};
  const regex = /<img[^>]*src=['"]([^'"]+)['"][^>]*alt=['"]([^'"]+)['"]/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    alts[match[1]] = match[2];
  }
  
  return alts;
}

function extractLinks(html, baseUrl) {
  const regex = /<a[^>]*href=['"]([^'"]+)['"]/gi;
  const links = [];
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith('http')) {
      links.push(href);
    } else if (!href.startsWith('#') && !href.startsWith('javascript:')) {
      links.push(new URL(href, baseUrl).href);
    }
  }
  
  return links;
}

// ─────────────────────────────────────────────────────────────────
// Scraper Functions
// ─────────────────────────────────────────────────────────────────

async function scrapePage(url) {
  try {
    console.log(`📄 Scraping: ${url}`);
    const html = await fetchUrl(url);
    return { url, html };
  } catch (error) {
    console.error(`❌ Error scraping ${url}: ${error.message}`);
    return null;
  }
}

async function scrapeGallery() {
  console.log('\n🎨 SCRAPING GALLERY...');
  const pages = [
    `${OLD_WEBSITE}/portfolio`,
    `${OLD_WEBSITE}/gallery`,
    `${OLD_WEBSITE}/`,
  ];
  
  const gallery = [];
  const processed = new Set();
  
  for (const pageUrl of pages) {
    const page = await scrapePage(pageUrl);
    if (!page) continue;
    
    const images = extractImageSrc(page.html, pageUrl);
    const alts = extractImageAlt(page.html);
    
    for (const imgSrc of images) {
      if (processed.has(imgSrc)) continue;
      processed.add(imgSrc);
      
      // Only include WordPress uploads
      if (!imgSrc.includes('/wp-content/uploads/')) continue;
      
      // Filter out tracking pixels and icons
      if (imgSrc.includes('pixel') || imgSrc.includes('favicon') || 
          imgSrc.includes('icon') || imgSrc.includes('logo') ||
          imgSrc.includes('shopping-bag') || imgSrc.includes('.svg')) continue;
      
      const title = alts[imgSrc] || path.basename(imgSrc).split('.')[0];
      
      gallery.push({
        url: imgSrc,
        title: title,
        category: 'Landscape' // Default, could be improved
      });
    }
  }
  
  return gallery;
}

async function scrapeShop() {
  console.log('\n🛍️  SCRAPING SHOP...');
  const pageUrl = `${OLD_WEBSITE}/shop`;
  
  const products = [];
  const processed = new Set();
  
  const page = await scrapePage(pageUrl);
  if (!page) return products;
  
  // Extract WooCommerce product data from HTML
  const productRegex = /<li[^>]*class="[^"]*product[^"]*"[^>]*>(.*?)<\/li>/gs;
  const matches = page.html.matchAll(productRegex);
  
  for (const match of matches) {
    const productHtml = match[1];
    
    // Extract image
    const imgMatch = productHtml.match(/<img[^>]*src="([^"]+)"/);
    if (!imgMatch) continue;
    const imgSrc = imgMatch[1];
    if (processed.has(imgSrc)) continue;
    processed.add(imgSrc);
    
    // Skip if not a WordPress upload
    if (!imgSrc.includes('/wp-content/uploads/')) continue;
    
    // Extract product title
    const titleMatch = productHtml.match(/<h2[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)<\/h2>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Product';
    
    // Extract price
    const priceMatch = productHtml.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>.*?([0-9]+(?:\.[0-9]{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;
    
    // Extract product link
    const linkMatch = productHtml.match(/<a[^>]*href="([^"]+)"[^>]*class="[^"]*woocommerce[^"]*"/);
    const productLink = linkMatch ? linkMatch[1] : null;
    
    products.push({
      url: imgSrc,
      title: title,
      price: price,
      medium: null,
      productPageUrl: productLink
    });
  }
  
  // Scrape product pages for details
  console.log(`\n📖 Fetching details for ${products.length} products...`);
  for (let i = 0; i < products.length; i++) {
    if (!products[i].productPageUrl) continue;
    
    try {
      console.log(`  [${i+1}/${products.length}] Fetching ${products[i].title}...`);
      const productPage = await scrapePage(products[i].productPageUrl);
      if (!productPage) continue;
      
      // Try to extract medium from product description
      const mediumMatch = productPage.html.match(/<p[^>]*>.*?(?:Medium|Material):\s*([^<]+)<\/p>/i);
      if (mediumMatch) {
        products[i].medium = mediumMatch[1].trim();
      }
      
      // Look for medium in description text
      const descMatch = productPage.html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/s);
      if (descMatch && !products[i].medium) {
        const text = descMatch[1].replace(/<[^>]+>/g, ' ').substring(0, 200);
        if (text.includes('oil') || text.includes('acrylic') || text.includes('watercolor') ||
            text.includes('canvas') || text.includes('paper') || text.includes('mixed')) {
          products[i].medium = text;
        }
      }
      
      await new Promise(r => setTimeout(r, 500)); // Rate limit
    } catch (error) {
      console.error(`    ⚠️  Could not fetch details: ${error.message}`);
    }
  }
  
  return products;
}

// ─────────────────────────────────────────────────────────────────
// Main Scraping Flow
// ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting julieannbrown.com.au scraper...\n');
  
  try {
    // Check if form-data is installed
    try {
      require('form-data');
    } catch (e) {
      console.log('📦 Installing required dependencies...');
      const { execSync } = require('child_process');
      execSync('npm install form-data', { stdio: 'inherit', cwd: __dirname });
    }
    
    const gallery = await scrapeGallery();
    const shop = await scrapeShop();
    
    console.log(`\n✅ Found ${gallery.length} gallery images`);
    console.log(`✅ Found ${shop.length} shop products`);
    
    if (gallery.length === 0 && shop.length === 0) {
      console.error('\n⚠️  No content found. The website may have a different structure.');
      console.log('💡 Next steps:');
      console.log('1. Check if julieannbrown.com.au is accessible');
      console.log('2. Inspect the HTML structure manually');
      console.log('3. Update the scraper to match the actual website structure');
      process.exit(1);
    }
    
    console.log('\n📥 Downloading images...');
    
    const galleryData = [];
    for (let i = 0; i < gallery.length; i++) {
      const item = gallery[i];
      try {
        const ext = path.extname(new URL(item.url).pathname) || '.jpg';
        const filename = `gallery-${i}${ext}`;
        console.log(`  [${i+1}/${gallery.length}] ${item.title}`);
        
        const localPath = await downloadFile(item.url, filename);
        console.log(`    ✓ Downloaded to ${filename}`);
        
        console.log(`    ⏳ Uploading to Cloudinary...`);
        const cloudinaryUrl = await uploadToCloudinary(localPath, 'gallery');
        console.log(`    ✓ Uploaded: ${cloudinaryUrl}`);
        
        galleryData.push({
          id: 'g' + Date.now() + i,
          title: item.title,
          src: cloudinaryUrl,
          category: item.category || 'Gallery',
          featured: i === 0 // Make first one featured
        });
        
        // Clean up local file
        fs.unlinkSync(localPath);
        
        // Rate limit to avoid overwhelming APIs
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`    ❌ Failed: ${error.message}`);
      }
    }
    
    const shopData = [];
    for (let i = 0; i < shop.length; i++) {
      const item = shop[i];
      try {
        const ext = path.extname(new URL(item.url).pathname) || '.jpg';
        const filename = `shop-${i}${ext}`;
        console.log(`  [${i+1}/${shop.length}] ${item.title}`);
        
        const localPath = await downloadFile(item.url, filename);
        console.log(`    ✓ Downloaded to ${filename}`);
        
        console.log(`    ⏳ Uploading to Cloudinary...`);
        const cloudinaryUrl = await uploadToCloudinary(localPath, 'shop');
        console.log(`    ✓ Uploaded: ${cloudinaryUrl}`);
        
        shopData.push({
          id: 's' + Date.now() + i,
          title: item.title,
          src: cloudinaryUrl,
          price: item.price || 0,
          medium: item.medium || '',
          sold: false,
          stripeLink: '',
          order: i
        });
        
        fs.unlinkSync(localPath);
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        console.error(`    ❌ Failed: ${error.message}`);
      }
    }
    
    // Save data files
    console.log('\n💾 Saving data files...');
    fs.writeFileSync(
      path.join(__dirname, 'data', 'gallery.json'),
      JSON.stringify(galleryData, null, 2)
    );
    console.log('✓ Saved data/gallery.json');
    
    fs.writeFileSync(
      path.join(__dirname, 'data', 'shop.json'),
      JSON.stringify(shopData, null, 2)
    );
    console.log('✓ Saved data/shop.json');
    
    // Clean up
    console.log('\n🧹 Cleaning up...');
    fs.rmSync(DOWNLOAD_DIR, { recursive: true, force: true });
    
    console.log('\n✨ Done! Your website has been updated with:');
    console.log(`   • ${galleryData.length} gallery images`);
    console.log(`   • ${shopData.length} shop products`);
    console.log('\n📋 Next steps:');
    console.log('   1. Review data/gallery.json and data/shop.json');
    console.log('   2. Add missing product details (prices, mediums, stripe links)');
    console.log('   3. Commit changes to GitHub');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
