const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, trim: true, unique: true, sparse: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  rating: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  primaryImage: { type: String },
  category: { type: String, index: true },
  inventory: {
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 0, min: 0 },
  },

  // Back-compat fields (older code references these)
  stock: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },

  isFeatured: { type: Boolean, default: false, index: true },
  sortOrder: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.index({ isFeatured: 1, sortOrder: 1 });
productSchema.index({ name: 'text' });


module.exports = mongoose.model('Product', productSchema);
