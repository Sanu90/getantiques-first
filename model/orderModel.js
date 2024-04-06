const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with orderModel");
  })
  .catch((error) => {
    console.log(error);
  });

const orderData = new mongoose.Schema({
  orderID: {
    type: String,
    required: true,
    trim: true,
  },

  user: {
    type: String,
    required: true,
    trim: true,
  },

  products: {
    type: Array,
    required: true,
    trim: true,
  },

  totalOrderValue: {
    type: Number,
    required: true,
    trim: true,
  },

  discount: {
    type: Number,
    required: true,
    trim: true,
  },

  address: {
    type: Object,
    required: true,
    trim: true,
  },

  paymentMethod: {
    type: String,
    required: true,
    trim: true,
  },

  date: {
    type: Date,
    trim: true,
  },

  status: {
    type: String,
    required: true,
    trim: true,
  },

  paymentStatus: {
    type: String,
    required: true,
    trim: true,
  },

  return_Reason: {
    type: String,
    trim: true,
  },

  cancel: {
    type: String,
    trim: true,
  },
});

const orderInfo = mongoose.model("order", orderData);
module.exports = orderInfo;
