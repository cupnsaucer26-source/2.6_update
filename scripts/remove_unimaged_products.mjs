import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve('server/.env') });

const TARGET_IDS = [
  'sb-MVJ0S4YG8APZ', // Orange
  'sb-MVJ0S71QUKSZ', // Yes Boss Boron
  'sb-MVJ0S7965BGD', // Yes Boss All 19:19:19
  'sb-MVJ0S7GAH6TJ'  // Yes Boss CN
];

const KEEP_IDS = [
  'sb-MVJ0S4EHJ99W', // Shakthi Triple Action Pro
  'sb-MVJ0S38MIJU3'  // Carbon Zyme
];

async function main() {
  const m = await import('../server/db.js');
  await m.connectDB();
  const db = m.db;
  
  console.log('--- Step 1: Pre-deletion Inspection ---');
  const allProdsBefore = await db.getAllProductsRaw();
  console.log(`Total products before: ${allProdsBefore.length}`);
  
  const toDelete = allProdsBefore.filter(p => TARGET_IDS.includes(p.id));
  console.log(`Found ${toDelete.length} target products to delete:`);
  toDelete.forEach(p => console.log(`  - [${p.id}] ${p.name} (${p.category}) Image: ${p.image}`));
  
  if (toDelete.length !== 4) {
    console.error('Warning: Expected 4 products to delete, but found:', toDelete.length);
  }

  console.log('\n--- Step 2: Verifying Products to Keep ---');
  const kept = allProdsBefore.filter(p => KEEP_IDS.includes(p.id));
  kept.forEach(p => {
    console.log(`  - [${p.id}] ${p.name} | Packs: ${JSON.stringify(p.packSizes)} | Selected: ${p.selectedPack} | Image: ${p.image}`);
  });
  
  // Guard check: ensure neither kept product is in toDelete
  for (const k of kept) {
    if (TARGET_IDS.includes(k.id)) {
      throw new Error(`CRITICAL GUARD FAILED: Kept product ${k.name} (${k.id}) is in deletion list!`);
    }
  }

  console.log('\n--- Step 3: Backing up target products ---');
  const backupDir = path.resolve('scratch');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, 'backup_removed_products_20261105.json');
  fs.writeFileSync(backupPath, JSON.stringify(toDelete, null, 2), 'utf8');
  console.log(`Backed up ${toDelete.length} products to: ${backupPath}`);

  console.log('\n--- Step 4: Checking references in orders & invoices ---');
  const allOrders = await db.getOrders();
  const ordersReferencing = allOrders.filter(o => 
    o.items && o.items.some(it => TARGET_IDS.includes(it.id) || TARGET_IDS.includes(it.productId))
  );
  console.log(`Orders referencing target products: ${ordersReferencing.length}`);

  let invoicesReferencingCount = 0;
  try {
    const allInvoices = await db.getInvoicesAllStores();
    const invoicesReferencing = allInvoices.filter(inv =>
      inv.items && inv.items.some(it => TARGET_IDS.includes(it.id) || TARGET_IDS.includes(it.productId))
    );
    invoicesReferencingCount = invoicesReferencing.length;
  } catch(e) {
    console.log('Invoice check error (non-fatal):', e.message);
  }
  console.log(`Invoices referencing target products: ${invoicesReferencingCount}`);

  console.log('\n--- Step 5: Executing safe removal ---');
  for (const p of toDelete) {
    const success = await db.deleteProduct(p.id);
    console.log(`Deleted product: [${p.id}] ${p.name} -> Result: ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  console.log('\n--- Step 6: Post-deletion Verification ---');
  const allProdsAfter = await db.getAllProductsRaw();
  console.log(`Total products after: ${allProdsAfter.length}`);
  
  const remainingMissing = allProdsAfter.filter(p => !p.image || p.image.includes('coming-soon') || p.image.includes('placeholder'));
  console.log(`Remaining products without image or with placeholder: ${remainingMissing.length}`);
  if (remainingMissing.length > 0) {
    remainingMissing.forEach(p => console.log(`  - [${p.id}] ${p.name} | Image: ${p.image}`));
  } else {
    console.log('✓ All 100% of remaining products now have real packaging artwork images!');
  }

  console.log('\n--- Step 7: Confirm Kept Products Still Present ---');
  const keptAfter = allProdsAfter.filter(p => KEEP_IDS.includes(p.id));
  keptAfter.forEach(p => {
    console.log(`  ✓ Confirmed Kept: [${p.id}] ${p.name} (${p.selectedPack}) - Image: ${p.image} - Online: ${p.online}`);
  });

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error executing product removal:', err);
  process.exit(1);
});
