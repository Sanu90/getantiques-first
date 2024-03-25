const orderModel = require("../model/orderModel");
const userModel = require("../model/userModel");
const cartModel = require("../model/cartModel");
const addressModel = require("../model/userAddressModel");
const productModel = require("../model/productModel");
const otpGenerator = require("otp-generator");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_ID_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const adminOrderDetails = async (req, res) => {
  try {
    console.log("Admin checking order details");
    const orderID = req.query.id;
    username = req.session.name;

    console.log("Order ID is: ", orderID);
    const eachOrderDetails = await orderModel.findOne({ orderID: orderID });
    console.log("eachOrderDetails is:", eachOrderDetails);
    console.log(eachOrderDetails.products.length);

    var data;
    for (let i = 0; i < eachOrderDetails.products.length; i++) {
      console.log("###############");
      console.log(eachOrderDetails.products[i].product);
      data = eachOrderDetails.products[i].product;
    }
    console.log("data outside loop is", data);

    const productData = await productModel.find({ _id: data });
    console.log("productData is :", productData);

    // console.log("The details of order is: ", eachOrderDetails);
    res.render("admin_orders_Details", {
      name: req.session.adminName,
      eachOrderDetails,
      productData,
    });
  } catch (error) {
    console.log(
      "Error happened between adminOrderDetails in OrderController ",
      error
    );
  }
};

const orderPage = async (req, res) => {
  try {
    let orderDetails = await orderModel.find({}).sort({ _id: -1 });
    console.log("All order details are: ", orderDetails);
    res.render("admin_orders", { name: req.session.adminName, orderDetails });
  } catch (error) {
    console.log("Error while Admin order page is fetched. " + error);
  }
};

const userOrder = async (req, res) => {
  try {
    console.log("User order page");
    console.log("****************");
    const userName = req.session.name;
    const orderHistory = await orderModel
      .find({ user: userName })
      .sort({ date: -1 });
    console.log("orderHistory is: ", orderHistory);

    // let orderDetails = await orderModel.aggregate([
    //   {
    //     $match: { _id: new ObjectId("65ec5c1b129fe2b778258ed3") },
    //   },
    //   {
    //     $unwind: "$products",
    //   },
    //   {
    //     $lookup: {
    //       from: "products",
    //       localField: "products.product",
    //       foreignField: "_id",
    //       as: "productDetails",
    //     },
    //   },
    //   {
    //     $unwind: "$productDetails",
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       productName: "$productDetails.product_name",
    //       productImage: "$productDetails.product_image",
    //       quantity: "$products.product_quantity",
    //       price: "$productDetails.price",
    //       date: "$date",
    //     },
    //   },
    // ]);

    //console.log("Order details: ", orderDetails);

    res.render("userOrders", { orderHistory });
  } catch (error) {
    console.log("Error while accessing userOrder (ordercontroller) : " + error);
  }
};

const orderIDGenerator = () => {
  const orderID = otpGenerator.generate(10, {
    digits: true,
    upperCaseAlphabets: true,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  var timestamp = new Date().getTime();
  //  var orderIDTimestamp1 = Math.floor(timestamp / 1000);
  return [orderID, timestamp];
};

const orderProduct = async (req, res) => {
  try {
    console.log("USER ORDERING A PRODUCT");
    console.log("***********************");
    username = req.session.name;
    userID = req.session.userID;
    let cart = await cartModel.find({ user: userID });
    const user = await userModel.findOne({ username: req.session.name });

    let status = ["Placed", "Shipped", "Out for Delivery", "Delivered"];
    initialStatus = status[0];
    let a = orderIDGenerator();
    console.log("Order ID generated plus timestamp :", a);
    let orderID = a[0];
    const date = new Date(a[1]);
    console.log("DATE IS: ", date);
    console.log("%%&&%%&&%%&&%%&&%%&&%%&&%%&&%%&&");
    // var datetime = new Date(a[1] * 1000);
    // console.log(datetime);
    // var date = datetime.toLocaleDateString();
    // console.log(date);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    let address = await addressModel.findOne(
      { _id: req.body.address },
      { _id: 0, user: 0 }
    );
    userOrderDetails = req.session.userCheckOutProductList;
    paymentMethod = req.body.payment;

    console.log("Values are:", req.body);
    console.log("______________________");
    console.log("Payment method is:", paymentMethod);
    console.log("Address ID for the order is: ", req.body.address);
    console.log("Address details are:", address);
    console.log("User name: " + username);
    console.log("Initial status when product is ordered :", status[0]);
    console.log("Checkout value: " + req.session.totalCheckoutCharge);
    console.log("Order ID:", orderID);
    console.log("Order date is:", date);
    console.log("User order product details:", userOrderDetails);
    console.log("cart value:", cart);
    console.log("USER details is:" + user);

    console.log("______________________");
    let ab;
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log(req.session.cart_Value_after_coupon);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

    if (req.session.cart_Value_after_coupon) {
      ab = req.session.cart_Value_after_coupon;
    } else ab = req.session.totalCheckoutCharge;

    let productOrderByUser = new orderModel({
      orderID: orderID,
      user: username,
      date: date,
      products: cart[0].item,
      address: address,
      totalOrderValue: ab,
      status: status[0],
      paymentMethod: req.body.payment,
      paymentStatus: "Success",
    });
    await productOrderByUser.save();
    console.log("USER made a ORDER");
    await cartModel.updateOne({ user: userID }, { $set: { item: [] } });
    res.render("userOrderPlaced", {
      user,
      orderID,
      date,
      initialStatus,
      paymentMethod,
    });
  } catch (error) {
    console.log(
      "Error while accessing orderProduct (ordercontroller) : " + error
    );
  }
};

const userEachOrderData = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("ORDER ID is: ", id);
    username = req.session.name;

    // const abcd = await orderModel.aggregate([
    //   {
    //     $match: { orderID: id },
    //   },
    //   { $unwind: "$products" },
    //   {
    //     $lookup: {
    //       from: "product",
    //       localField: "products.product",
    //       foreignField: "_id",
    //       as: "productDetails",
    //     },
    //   },
    //   // { $unwind: "$productDetails" },
    // ]);

    // console.log("abcd is.....", abcd);
    // console.log(abcd[0].products.product);
    const eachOrderDetails = await orderModel.findOne({ orderID: id });

    console.log("Each order Details:", eachOrderDetails);
    console.log(eachOrderDetails.products.length);

    var data;
    for (let i = 0; i < eachOrderDetails.products.length; i++) {
      console.log("###############");
      // console.log(eachOrderDetails.products[i].product);
      data = eachOrderDetails.products[i].product;
    }
    console.log("data outside loop is", data);

    const aaaaa = await productModel.find({ _id: data });
    console.log("aaaaa", aaaaa);

    console.log("USER IN ORDER DETAILS PAGE");

    res.render("userOrderDetailsPage", { eachOrderDetails, aaaaa });
  } catch (error) {
    console.log(
      "Error happened in userEachOrderData in ordercontroller",
      error
    );
  }
};

const createOnlineOrder = async (req, res) => {
  try {
    const amount = req.body.amount * 100;
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      if (!err) {
        res.status(200).send({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: RAZORPAY_ID_KEY,
          product_name: req.body.name,
          description: req.body.description,
          contact: "8567345632",
          name: "Sandeep Sharma",
          email: "sandeep@gmail.com",
        });
      } else {
        res.status(400).send({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log(
      "Error happened while createOnlineOrder in orderController",
      error
    );
  }
};

const test = async (req, res) => {
  console.log("Hey test payment");

  console.log(req.body);
  if (req.body.payment == "wallet") {
    console.log("Go to wallet payment");
  } else if (req.body.payment == "online") {
    console.log("Online Razorpay");
  } else if (req.body.payment == "Cash on Delivery") {
    console.log("COD");
  }
};

module.exports = {
  orderPage,
  userOrder,
  orderProduct,
  userEachOrderData,
  createOnlineOrder,
  adminOrderDetails,
  test,
};
