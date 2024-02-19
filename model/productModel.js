const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with productModel");
  })
  .catch((error) => {
    console.log(error);
  });

const productData = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  rate: {
    type: Number,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    trim: true,
  },
  image: {
    type: Array,
    required: true,
    trim: true,
  },
  hide: {
    type: Number,
    required: true,
    trim: true,
  },
});

const proData = mongoose.model("product", productData);
module.exports = proData;
