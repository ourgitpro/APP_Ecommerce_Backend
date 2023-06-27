const express = require("express");
const {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder
} = require("../../controllers/orderController/orderController");
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../../middleware/auth/auth");
const orderRoute = express.Router();
orderRoute.post(
  "/order/new",
  isAuthenticatedUser,

  newOrder
);
orderRoute.route("/order/:id").get(isAuthenticatedUser, getSingleOrder);
orderRoute.route("/orders/me").get(isAuthenticatedUser, myOrders);
orderRoute
  .route("/admin/orders")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);
  orderRoute
  .route("/admin/order/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrder);
module.exports = orderRoute;
