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
    // required: true,
    trim: true,
  },

  item: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        // required: true,
        trim: true,
      },

      //product_image: {
      //   type: Array,
      //   required: true,
      // },
    },
  ],
  product_quantity: {
    type: Number,
    // required: true,
    trim: true,
  },

  //product: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "product",
  //   required: true,
  //   trim: true,
  // },

  // product_quantity: {
  //   type: Number,
  //   required: true,
  //   trim: true,
  // },

  // product_total_price: {
  //   type: Number,
  //   required: true,
  //   trim: true,
  // },

  // cart_price: {
  //   type: Number,
  //   required: true,
  //   trim: true,
  // },
});

const cartInfo = mongoose.model("cart", cartData);
module.exports = cartInfo;
