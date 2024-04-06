const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with cartModel");
  })
  .catch((error) => {
    console.log(error);
  });

const cartData = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    trim: true,
  },

  item: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        trim: true,
      },
      product_name: {
        type: String,
        trim: true,
      },

      product_quantity: {
        type: Number,
        trim: true,
      },

      product_rate: {
        type: Number,
        trim: true,
      },

      product_rate_before_discount: {
        type: Number,
        trim: true,
      },

      status: {
        type: String,
        trim: true,
        default: "Placed",
      },
    },
  ],
});

const cartInfo = mongoose.model("cart", cartData);
module.exports = cartInfo;
