const mongoose = require("mongoose");
require("dotenv").config();
mongoose
  .connect(process.env.MONGO_CONNECTOR)
  .then(() => {
    console.log("Connection established with walletModel");
  })
  .catch((error) => {
    console.log(error);
  });

const walletData = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  wallet: {
    type: Number,
    default: 0,
  },
  walletTransactions: [
    {
      date: { type: Date },
      type: { type: String },
      amount: { type: Number },
    },
  ],
});

const walletModel = mongoose.model("wallets", walletData);
module.exports = walletModel;
