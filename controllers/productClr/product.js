const Product = require("../../models/productModel/productModel");
const ErrorHandler = require("../../utilss/utils/error");
const CatchError = require("../../middleware/catchError/catchError");
const ApiFeatures = require("../../utilss/ApiFeauter/ApiFeauter");
//create product
const createProduct = CatchError(async (req, res, next) => {
  req.body.user = req.user.id;
  const product = await Product.create(req.body);
  res.status(200).json({ success: true, product });
});
//get all product
const productClr = CatchError(async (req, res, next) => {
  const resultPerPage = 8;
  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter();

  const productsCount = await Product.countDocuments(apiFeature.query);

  apiFeature.pagination(resultPerPage);
  const products = await apiFeature.query;

  let filteredProductsCount; // Declare the variable here

  if (products) {
    filteredProductsCount = products.length; // Initialize the variable if products exist
  } else {
    filteredProductsCount = 0; // Initialize the variable to 0 if products is undefined or empty
  }

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  });
});

//get single product
const productDetails = CatchError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  try {
    if (!product) {
      return res
        .status(500)
        .json({ success: false, msg: "Products Not Found" });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ errors: "Internal Server Error" });
  }
});
//Update Product for Admin
const updateProduct = CatchError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    res.status(500).json({ success: true, msg: "Product Not Found" });
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({ success: true, product });
});
// Delete Product
const deleteProduct = CatchError(async (req, res, next) => {
  //let product = await Product.findById(req.params.id);
  //console.log(product);
  //if (!product) {
  // return res.status(500).json({ success: false, msg: "Product Not Found" });
  //}
  //await product.remove;
  // res.status(200).json({ success: true, msg: "Product Delete" });
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.json(deletedProduct);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ errors: "Internal Server Error" });
  }
});
// Create New Review or Update the review
const createProductReview = CatchError(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.rating = rating;
        rev.comment = comment;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});
// Get All Reviews of a product
const getProductReviews = CatchError(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return res.status(404).json({ success: false, msg: "Product Not Found" });
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});
// Delete Review
const deleteReview = CatchError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return res.status(404).json({ success: false, msg: "Product Not Found" });
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

module.exports = {
  productClr,
  createProduct,
  updateProduct,
  deleteProduct,
  productDetails,
  createProductReview,
  getProductReviews,
  deleteReview,
};
