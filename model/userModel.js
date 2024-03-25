const mongoose = require("mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with userModel");
  })
  .catch((error) => {
    console.log(error);
  });

const userData = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  isAdmin: {
    type: Number,
    required: true,
    trim: true,
  },
  hide: {
    type: Number,
    required: true,
    trim: true,
  },
  // gender: {
  //   type: String,
  //   required: false,
  //   trim: true,
  // },
  dob: {
    type: Date,
    required: false,
    trim: true,
  },
  coupon: {
    type: Array,
    trim: true,
  },
  wallet: {
    type: Number,
    trim: true,
  },
});

const Users = mongoose.model("user", userData);
module.exports = Users;
