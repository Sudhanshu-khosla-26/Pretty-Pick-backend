const Product = require('../models/product.model');

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
};

exports.getAllProducts = async (req, res) => {
  const { keyword = '', category, min, max } = req.query;
  let query = {
    name: { $regex: keyword, $options: 'i' },
    ...(category && { category }),
    ...(min && max && { price: { $gte: min, $lte: max } })
  };
  const products = await Product.find(query);
  res.json(products);
};

exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
};

exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
};
