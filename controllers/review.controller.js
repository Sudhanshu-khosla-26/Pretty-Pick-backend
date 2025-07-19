const Review = require('../models/review.model');
const Product = require('../models/product.model');

exports.createReview = async (req, res) => {
  const { productId, rating, comment } = req.body;

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    comment
  });

  const reviews = await Review.find({ product: productId });
  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    numReviews: reviews.length
  });

  res.status(201).json(review);
};

exports.getReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name');
  res.json(reviews);
};
