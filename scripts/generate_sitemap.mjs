import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

import { db, connectDB } from '../server/db.js';

async function generateSitemap() {
  await connectDB();
  const products = await db.getProducts({ activeOnly: true });
  const baseUrl = 'https://www.sathyamagromart.com';

  const staticUrls = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/store`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/orders`, changefreq: 'daily', priority: '0.7' },
    { loc: `${baseUrl}/agronomy`, changefreq: 'weekly', priority: '0.8' },
  ];

  const productUrls = products.map(p => ({
    loc: `${baseUrl}/product/${p.id}`,
    lastmod: new Date(p.updatedAt || Date.now()).toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: '0.8'
  }));

  const allUrls = [...staticUrls, ...productUrls];

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    allUrls.map(u => '  <url>\n' +
      `    <loc>${u.loc}</loc>\n` +
      (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      '  </url>').join('\n') +
    '\n</urlset>';

  const targetPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(targetPath, xml, 'utf8');
  console.log(`✔ Sitemap successfully generated at ${targetPath} with ${allUrls.length} URLs (${productUrls.length} products).`);
  process.exit(0);
}

generateSitemap().catch(err => {
  console.error('Failed to generate sitemap:', err);
  process.exit(1);
});
