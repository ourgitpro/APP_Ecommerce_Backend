const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
dotenv.config();
const dbConnect = require("./config/db/dbConnect");
const productRoute = require("./route/productRoute/product");
const userRoute = require("./route/userRoute/user");
const orderRoute = require("./route/oderRoute/order");
//const error = require("./middleware/error/error");

const app = express();
//DB
dbConnect();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
//Middleware
app.use(express.json());
app.use(cookieParser());
// Middleware for Errors
//app.use(error)
// Middleware for Errors
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
//cors
app.use(cors());
// app.use(cors()); // allows all origins
//Users route
app.use("/api/v1", productRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", orderRoute);

const port = process.env.PORT || 5000;
app.listen(port, console.log(`Server is running ${port}`));
