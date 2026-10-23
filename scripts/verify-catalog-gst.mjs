import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = process.cwd();
const { db, connectDB } = await import(pathToFileURL(path.join(rootDir, 'server', 'db.js')).href);
await connectDB();

const prods = await db.getAllProductsRaw();
console.log(`\n================= VERIFYING ALL ${prods.length} PRODUCTS IN MONGODB =================`);
console.log('| # | Product Name | Qty / Pack | HSN Code | GST % | Price (₹) |');
console.log('|---|---|---|---|---|---|');

prods.sort((a,b) => a.name.localeCompare(b.name)).forEach((p, idx) => {
  const packs = Array.isArray(p.packSizes) ? p.packSizes.join(', ') : (p.selectedPack || '');
  console.log(`| ${idx + 1} | ${p.name} | ${packs} | ${p.hsnCode || 'MISSING'} | ${p.gstRate !== undefined ? p.gstRate + '%' : 'MISSING'} | ₹${p.price} |`);
});

process.exit(0);
