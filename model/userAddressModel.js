const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with userAddressModel");
  })
  .catch((error) => {
    console.log(error);
  });

const addressData = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },

  mobile: {
    type: Number,
    required: true,
    trim: true,
  },

  houseName: {
    type: String,
    required: true,
    trim: true,
  },
  street: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
  },
  pincode: {
    type: Number,
    required: true,
    trim: true,
  },
  primary: {
    type: Number,
    required: true,
    trim: true,
  },
});

const addressInfo = mongoose.model("address", addressData);
module.exports = addressInfo;
