const Product = require('../models/product.model');
const { toAbsoluteUrl, mapImageArrayToAbsolute } = require('../utils/assetUrls');

const toProductDTO = (doc, req) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id?.toString?.() || obj.id,
    name: obj.name,
    slug: obj.slug,
    description: obj.description,
    price: obj.price,
    currency: obj.currency || 'USD',
    rating: obj.rating || 0,
    images: mapImageArrayToAbsolute(req, obj.images || []),
    primaryImage: toAbsoluteUrl(req, obj.primaryImage || (obj.images && obj.images[0]) || null),
    category: obj.category || null,
    inventory: obj.inventory || { inStock: obj.isAvailable ?? true, quantity: obj.stock ?? 0 },
    isFeatured: Boolean(obj.isFeatured),
    sortOrder: obj.sortOrder ?? 0,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product: toProductDTO(product, req) });
};

exports.getAllProducts = async (req, res) => {
  const {
    search,
    keyword,
    featured,
    category,
    limit,
    cursor,
  } = req.query;

  const resolvedSearch = (search || keyword || '').toString().trim();
  const resolvedLimit = Math.min(parseInt(limit || '20', 10) || 20, 100);

  const query = {};
  if (category) query.category = category;

  const featuredBool = featured === 'true' || featured === true;
  if (featuredBool) query.isFeatured = true;

  if (resolvedSearch) {
    // If text index exists, $text is preferable. Fallback to regex if it errors.
    query.$text = { $search: resolvedSearch };
  }

  // Cursor pagination: use _id as cursor for default sort order.
  const useCursor = cursor && !featuredBool;
  if (useCursor) {
    query._id = { $lt: cursor };
  }

  const sort = featuredBool ? { sortOrder: 1, _id: 1 } : { _id: -1 };

  let docs;
  try {
    docs = await Product.find(query)
      .sort(sort)
      .limit(resolvedLimit + 1);
  } catch (err) {
    // Fallback when text search is unsupported (e.g., index missing)
    if (query.$text) {
      delete query.$text;
      query.name = { $regex: resolvedSearch, $options: 'i' };
      docs = await Product.find(query)
        .sort(sort)
        .limit(resolvedLimit + 1);
    } else {
      throw err;
    }
  }

  const hasNext = docs.length > resolvedLimit;
  const page = docs.slice(0, resolvedLimit);
  const nextCursor = hasNext ? page[page.length - 1]._id.toString() : undefined;

  res.status(200).json({
    items: page.map((p) => toProductDTO(p, req)),
    ...(nextCursor ? { nextCursor } : {}),
  });
};

exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product: toProductDTO(product, req) });
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product: toProductDTO(product, req) });
};

exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
};
