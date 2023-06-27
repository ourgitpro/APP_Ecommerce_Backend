const express = require("express");
const {
  productClr,
  createProduct,
  updateProduct,
  deleteProduct,
  productDetails,
  createProductReview,
  getProductReviews,
  deleteReview,
} = require("../../controllers/productClr/product");
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../../middleware/auth/auth");
const productRoute = express.Router();
productRoute.get("/products", productClr);
productRoute.post(
  "/product",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  createProduct
);
productRoute.route("/product/:id").get(productDetails);
productRoute
  .route("/product/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct);
productRoute
  .route("/product/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);
productRoute.route("/review").put(isAuthenticatedUser, createProductReview);
productRoute
  .route("/reviews")
  .get(getProductReviews)
  .delete(isAuthenticatedUser, deleteReview);
module.exports = productRoute;
