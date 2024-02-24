const orderModel = require("../model/orderModel");

const orderPage = (req, res) => {
  try {
    res.render("admin_orders", { name: req.session.adminName });
  } catch (error) {
    console.log("Error while Admin order page is fetched. " + error);
  }
};

const userOrder = async (req, res) => {
  try {
    res.render("userOrders");
    console.log("User order page");
  } catch (error) {
    console.log("Error while accessing order : " + error);
  }
};

module.exports = {
  orderPage,
  userOrder,
};
