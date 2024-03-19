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
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "user",
  //   required: true,
  //   trim: true,
  // },
  user: {
    type: String,
    required: true,
    trim: true,
  },

  date: {
    type: Date,
    trim: true,
  },

  // product: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "product",
  //   required: true,
  //   trim: true,
  // },

  products: {
    type: Array,
    required: true,
    trim: true,
  },

  address: {
    type: Object,
    required: true,
    trim: true,
  },

  // quantity: {
  //   type: Number,
  //   required: true,
  //   trim: true,
  // },

  totalOrderValue: {
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

  paymentStatus: {
    type: String,
    required: true,
    trim: true,
  },
});

const orderInfo = mongoose.model("order", orderData);
module.exports = orderInfo;
