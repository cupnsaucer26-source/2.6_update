import { db, connectDB } from '../server/db.js';

async function run() {
  await connectDB();

  const existing = await db.findSameNamedProduct('Demo Product');
  if (existing) {
    console.log(`Found existing demo product: ${existing.id}`);
    const updated = await db.updateProduct(existing.id, {
      name: 'Demo Product',
      price: 1,
      originalPrice: 1,
      mrp: 1,
      stock: 9999,
      online: true,
      visibility: 'both',
      gstRate: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      packSizes: ['1 Unit'],
      selectedPack: '1 Unit',
      packagePrices: { '1 Unit': 1 },
      packageMrps: { '1 Unit': 1 },
      packDetails: [{ size: '1 Unit', price: '1', mrp: '1' }]
    });
    console.log('✅ Demo product updated successfully:', { id: updated.id, name: updated.name, price: updated.price });
  } else {
    const created = await db.createProduct({
      name: 'Demo Product',
      tagline: 'Live Payment Verification · ₹1 Test Item',
      category: 'Bio-Stimulant',
      hsnCode: '31010099',
      gstRate: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      price: 1,
      originalPrice: 1,
      mrp: 1,
      discount: '0% OFF',
      stock: 9999,
      crops: ['All Crops'],
      diseases: ['General Test'],
      activeIngredient: 'Live Payment Gateway Test Formulation',
      dosage: '1 Unit',
      packSizes: ['1 Unit'],
      selectedPack: '1 Unit',
      packagePrices: { '1 Unit': 1 },
      packageMrps: { '1 Unit': 1 },
      packDetails: [{ size: '1 Unit', price: '1', mrp: '1' }],
      form: 'Unit',
      emoji: '🧪',
      badge: 'Test Item',
      image: '/assets/products/gold-gel.jpg',
      images: ['/assets/products/gold-gel.jpg'],
      description: 'Demo product created for testing live Razorpay payments and order creation.',
      detailedDescription: 'This product is created with a ₹1 price for testing live payment gateway checkouts, signature verification, and automated order confirmations.',
      visibility: 'both',
      online: true,
      sortOrder: 0
    });
    console.log('✅ Demo product created successfully:', { id: created.id, name: created.name, price: created.price });
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Failed to create/update demo product:', err);
  process.exit(1);
});
