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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
    trim: true,
  },

  date: {
    type: Date,
    required: true,
    trim: true,
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true,
    trim: true,
  },

  quantity: {
    type: Number,
    required: true,
    trim: true,
  },

  amount: {
    type: Number,
    required: true,
    trim: true,
  },

  status: {
    type: String,
    required: true,
    trim: true,
  },

  paymentMethod: {
    type: String,
    required: true,
    trim: true,
  },
  return: {
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
