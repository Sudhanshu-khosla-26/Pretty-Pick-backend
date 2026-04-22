/* eslint-disable no-console */
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/product.model');
const { products } = require('../seeds/products.bubblebuy');
const { normalizeAssetPath } = require('../utils/assetUrls');

dotenv.config();

const mapSeedToDbProduct = (p) => {
  const images = (p.images || []).map(normalizeAssetPath);
  const primaryImage = normalizeAssetPath(p.primaryImage || images[0] || null);

  const inventory = p.inventory || { inStock: true, quantity: 0 };

  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    currency: p.currency || 'USD',
    rating: p.rating || 0,
    images,
    primaryImage,
    category: p.category,
    inventory,

    // back-compat
    stock: inventory.quantity,
    isAvailable: inventory.inStock,

    isFeatured: Boolean(p.isFeatured),
    sortOrder: p.sortOrder || 0,
  };
};

const seed = async () => {
  await connectDB();

  const operations = products.map((p) => {
    if (!p.slug) throw new Error(`Seed product missing slug: ${p.name}`);

    return {
      updateOne: {
        filter: { slug: p.slug },
        update: { $set: mapSeedToDbProduct(p) },
        upsert: true,
      },
    };
  });

  const result = await Product.bulkWrite(operations, { ordered: false });

  console.log('✅ Products seeded (upserted by slug)');
  console.log({
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
    matched: result.matchedCount,
  });

  const total = await Product.countDocuments();
  console.log(`Total products in DB: ${total}`);
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Product seeding failed:', err);
    process.exit(1);
  });
