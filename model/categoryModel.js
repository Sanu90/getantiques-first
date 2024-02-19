const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with categoryModel");
  })
  .catch((error) => {
    console.log(error);
  });

const categoryData = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  hide: {
    type: Number,
    required: true,
    trim: true,
  },
});

const catData = mongoose.model("category", categoryData);
module.exports = catData;
