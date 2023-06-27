
const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await  mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(`Error ${error.message}`);
  }
};

module.exports = dbConnect;