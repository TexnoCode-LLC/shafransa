import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://shafransa.com';
const LANGUAGES = ['az', 'en', 'ru', 'tr'];

// Helper to escape special XML characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Mock items definitions for sitemap generation
const STATIC_ROUTES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/marketplace', priority: '0.9', changefreq: 'daily' },
  { url: '/herbs', priority: '0.9', changefreq: 'daily' },
  { url: '/therapists', priority: '0.8', changefreq: 'weekly' },
  { url: '/blogs', priority: '0.8', changefreq: 'weekly' },
  { url: '/about', priority: '0.6', changefreq: 'monthly' },
  { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/how-it-works', priority: '0.6', changefreq: 'monthly' },
  { url: '/ai-consultant', priority: '0.7', changefreq: 'weekly' },
];

const PRODUCTS = [
  'seed-product-saffron-tea',
  'seed-product-lavender-oil',
  'seed-product-turmeric-capsules',
  'seed-product-ginger-extract',
];

const HERBS = [
  'seed-herb-saffron',
  'seed-herb-lavender',
  'seed-herb-turmeric',
  'seed-herb-ginger',
];

const API_URL = process.env.SITEMAP_API_URL || 'https://api.shafransa.com/api';

// Fitoterapevt və bloq linkləri real API-dən (əvvəl mövcud olmayan mock id-lər idi və 404 verirdi).
// API əlçatan deyilsə build dayanmır — sadəcə bu linklər sitemap-ə düşmür.
async function fetchIds(endpoint, pick) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Bloqlar üçün SEO URL (slug) varsa o işlədilir
    const ids = pick((await res.json())?.data).map(item => item?.slug || item?.id).filter(Boolean);
    console.log(`ℹ️  ${endpoint}: ${ids.length} link`);
    return ids;
  } catch (error) {
    console.warn(`⚠️  ${endpoint} alınmadı (${error.message}) — sitemap-ə əlavə olunmur`);
    return [];
  }
}

const SELLERS = [
  'seed-seller-shafransa',
];

async function generateSitemap() {
  const [THERAPISTS, BLOGS] = await Promise.all([
    fetchIds('/therapists/verified', data => (Array.isArray(data) ? data : [])),
    fetchIds('/blogs?page=1&limit=500', data => (Array.isArray(data?.data) ? data.data : [])),
  ]);
  const currentDate = new Date().toISOString().split('T')[0];

  const routes = [];

  // 1. Add static routes
  STATIC_ROUTES.forEach(route => {
    routes.push({
      loc: `${BASE_URL}${route.url}`,
      lastmod: currentDate,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  });

  // 2. Add products
  PRODUCTS.forEach(id => {
    routes.push({
      loc: `${BASE_URL}/product/${id}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8',
    });
  });

  // 3. Add herbs
  HERBS.forEach(id => {
    routes.push({
      loc: `${BASE_URL}/herb/${id}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8',
    });
  });

  // 4. Add therapists
  THERAPISTS.forEach(id => {
    routes.push({
      loc: `${BASE_URL}/therapist/${id}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.7',
    });
  });

  // 5. Add blogs
  BLOGS.forEach(id => {
    routes.push({
      loc: `${BASE_URL}/blog/${id}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.7',
    });
  });

  // 6. Add sellers
  SELLERS.forEach(id => {
    routes.push({
      loc: `${BASE_URL}/seller/${id}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.7',
    });
  });

  // Build XML content with XSL stylesheet header for browser rendering
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  routes.forEach(item => {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`✅ Sitemap successfully generated at: ${outputPath} (${routes.length} canonical routes indexed)`);
}

generateSitemap();

