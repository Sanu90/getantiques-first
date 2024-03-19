const mongoose = require("mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with wishlistModel");
  })
  .catch((error) => {
    console.log(error);
  });

const wishlistData = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    trim: true,
  },
  products: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
        trim: true,
      },
    },
  ],
});

const wishlistInfo = mongoose.model("wishlist", wishlistData);
module.exports = wishlistInfo;
