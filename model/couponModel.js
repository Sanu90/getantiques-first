const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with couponModel");
  })
  .catch((error) => {
    console.log(error);
  });

const couponData = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  expiry: {
    type: Date,
    required: true,
    trim: true,
  },
  discount: {
    type: Number,
    required: true,
    trim: true,
  },
  minimum_cart_value: {
    type: Number,
    required: true,
    trim: true,
  },
});

const coupon = mongoose.model("coupon", couponData);
module.exports = coupon;
