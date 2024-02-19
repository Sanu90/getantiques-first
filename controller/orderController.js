const orderModel = require("../model/orderModel");

const orderPage = (req, res) => {
  try {
    res.render("admin_orders", { name: req.session.name });
  } catch (error) {
    console.log("Error while Admin order page is fetched. " + error);
  }
};

module.exports = {
  orderPage,
};
