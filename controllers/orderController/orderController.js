const Order = require("../../models/orderModel/orderModel");
const Product = require("../../models/productModel/productModel");
const CatchError = require("../../middleware/catchError/catchError");

// Create new Order
const newOrder = CatchError(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});
// get Single Order
const getSingleOrder = CatchError(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return res.status(404).json({ errors: "Internal Server Error" });
  }

  res.status(200).json({
    success: true,
    order,
  });
});
// get logged in user  Orders
const myOrders = CatchError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});
// get all Orders -- Admin
const getAllOrders = CatchError(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});
// update Order Status -- Admin
const updateOrder = CatchError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    returnres.status(404).json({ errors: "Internal Server Error" });
  }

  if (order.orderStatus === "Delivered") {
    return res.status(400).json({ errors: "Internal Server Error" });
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });
  }
  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.Stock -= quantity;

  await product.save({ validateBeforeSave: false });
}
// delete Order -- Admin
const deleteOrder = CatchError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(400).json({ errors: "Internal Server Error" });
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});

module.exports = {
  newOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder
};
