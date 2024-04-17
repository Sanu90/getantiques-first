const orderModel = require("../model/orderModel");
const userModel = require("../model/userModel");
const cartModel = require("../model/cartModel");
const addressModel = require("../model/userAddressModel");
const productModel = require("../model/productModel");
const otpGenerator = require("otp-generator");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Razorpay = require("razorpay");
const walletModel = require("../model/walletModel");
const couponModel = require("../model/couponModel");
const puppeteer = require("puppeteer");
const fs = require("fs");

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
    console.log(
      "eachOrderDetails.paymentStatus is------------>",
      eachOrderDetails.paymentStatus
    );

    let orderData = await orderModel.aggregate([
      { $match: { orderID: orderID } },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 0,
          date: 1,
          productName: "$productDetails.name",
          productImage: { $arrayElemAt: ["$productDetails.image", 0] },
          productPrice: "$productDetails.rate_after_discount",
          productStatus: "$products.status",
          productReason: "$products.reason",
          productID: "$products.product",
          productCartQuantity: "$products.product_quantity",
          total: {
            $multiply: [
              "$productDetails.rate_after_discount",
              "$products.product_quantity",
            ],
          },
        },
      },
    ]);
    console.log("ORDER DATA USING AGGREGATION FOR ADMIN IS:", orderData);

    res.render("admin_orders_Details", {
      name: req.session.adminName,
      eachOrderDetails,
      orderData,
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
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 6;
    var orderDetails = await orderModel
      .find({})
      .sort({ _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await orderModel.find({}).countDocuments();
    console.log("Total orders:", count);
    //let orderDetails = await orderModel.find({}).sort({ _id: -1 });
    console.log("All order details are: ", orderDetails);
    res.render("admin_orders", {
      name: req.session.adminName,
      orderDetails,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.log("Error while Admin order page is fetched. " + error);
  }
};

const check_order_returns = async (req, res) => {
  try {
    console.log("Admin in check_order_returns page");

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;

    const returnData = await orderModel.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.status": "Return Initiated",
        },
      },
      {
        $limit: limit * 1,
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $sort: { "products.returnDate": -1 },
      },
    ]);

    console.log("******************************");
    console.log("Return Data is: ", returnData);
    console.log(returnData.length);
    const totalPages = Math.ceil(returnData.length / limit);
    console.log("******************************");

    res.render("admin_orders_Returns", {
      name: req.session.adminName,
      returnData,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(
      "Error happened between check_order_returns in orderController ",
      error
    );
  }
};

const userOrder = async (req, res) => {
  try {
    if (!req.query) {
      message = "";
    } else {
      message = req.query.message;
    }
    console.log("User order page");
    console.log("****************");
    const userName = req.session.name;
    // const orderHistory = await orderModel
    //   .find({ user: userName })
    //   .sort({ date: -1 });
    // console.log("orderHistory is: ", orderHistory);

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 6;
    const orders = await orderModel
      .find({ user: userName })
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const orderCount = await orderModel
      .find({ user: userName })
      .countDocuments({});
    const totalPages = Math.ceil(orderCount / limit);

    res.render("userOrders", {
      orders,
      orderCount,
      message,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(
      "Error while accessing userOrder in ordercontrollerx : " + error
    );
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

var status = [];
const cashOnDelivery = async (req, res) => {
  try {
    console.log("USER ORDERING A PRODUCT");
    console.log("******************************");
    username = req.session.name;
    userID = req.session.userID;
    if (req.session.user_Applied_Coupon) {
      couponName = req.session.user_Applied_Coupon;
      console.log(
        "Coupon which user entered is:----------------->>>>>>>>>>())()()()()*() ",
        couponName
      );
      await userModel.updateOne(
        { username: username },
        { $push: { coupon: couponName } }
      );
    }

    const cart = await cartModel.find({ user: userID });
    const user = await userModel.findOne({ username: req.session.name });
    let addressID;
    let payment;
    console.log(req.query);
    console.log("req.body is ", req.body);
    console.log(typeof req.body.amount);
    console.log(typeof req.body.discount);
    // console.log(req.query.length);
    if (req.query.addressID) {
      addressID = req.query.addressID;
      payment = req.query.payment;
      amount = req.session.amount_using_razorpay / 100;
      discount = req.session.discount_using_razorpay;
      console.log("Its entering inside req.query");
    } else if (req.body.addressID) {
      addressID = req.body.addressID;
      payment = req.body.payment;
      amount = req.body.amount;
      discount = req.body.discount;
      console.log("Its entering inside req.body");
    }
    console.log("addressID is: ", addressID);
    console.log("Payment mode is: ", payment);
    status = ["Placed", "Shipped", "Out for Delivery", "Delivered"];
    initialStatus = status[0];
    let a = orderIDGenerator();
    console.log("Order ID generated plus timestamp :", a);
    let orderID = a[0];
    console.log("Date is(timestamp)  ", a[1]);

    const OrderDate = new Date(a[1]).toDateString();
    console.log("DATE OF ORDER IS: (Date and Day) ", OrderDate);

    const Order_Date = new Date(a[1]);
    console.log("Usual Date is: ", Order_Date);
    console.log("%%&&%%&&%%&&%%&&%%&&%%&&%%&&%%&&");

    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    let address = await addressModel.findOne(
      { _id: addressID },
      { _id: 0, user: 0 }
    );
    userOrderDetails = req.session.userCheckOutProductList;
    paymentMethod = payment;

    // // console.log("Values are:", req.body);
    console.log("______________________");
    console.log("Payment method is:", paymentMethod);
    console.log("Address details are:", address);
    console.log("User name: " + username);
    console.log("Initial status when product is ordered :", status[0]);
    // // console.log("Checkout value: " + req.session.totalCheckoutCharge);amount
    // console.log("Checkout value before discount: ", amount);
    // console.log(typeof amount)
    // console.log(typeof req.body.discount);
    // console.log("-------------------------<><><><<><<", req.body.discount);
    let couponDiscount;
    if (req.body.discount == 0 || req.session.discount_using_razorpay == 0) {
      couponDiscount = 0;
      //amount -= couponDiscount;
    } else if (
      req.body.discount > 0 ||
      req.session.discount_using_razorpay > 0
    ) {
      couponDiscount = req.body.discount
        ? req.body.discount
        : req.session.discount_using_razorpay
        ? req.session.discount_using_razorpay
        : 0;
    }
    console.log("Discount amount is: ", couponDiscount);
    console.log("Checkout value after discount: ", amount);
    console.log(typeof amount);
    console.log(typeof couponDiscount);

    console.log("Order ID:", orderID);
    console.log("Order date is:", Order_Date);
    console.log("User order product details:", userOrderDetails);
    console.log("CART VALUE IS----------------------------------->>>>>>>>>>:");
    console.log(cart[0].item);

    // // adding a new field "status" in each product details when saving order //
    // // cart[0].item.forEach((value) => {
    // //   value.test = "Placed";
    // //   console.log(value);
    // // });
    // // console.log("product data to be saved in order collection", cart[0].item);

    console.log("------------------------------------------------<<<<<<<<<<<");
    console.log("USER details is:" + user);
    console.log("______________________");

    // //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    // // let ab;
    // console.log(
    //   "Cart value after using coupon is: ",
    //   req.session.cart_Value_after_coupon
    // );

    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("address is:", address);

    // if (req.session.cart_Value_after_coupon) {
    //   ab = req.session.cart_Value_after_coupon;
    // } else ab = req.session.totalCheckoutCharge;

    let productOrderByUser = new orderModel({
      orderID: orderID,
      user: username,
      date: Order_Date,
      products: cart[0].item,
      address: address,
      totalOrderValue: amount,
      status: status[0],
      paymentMethod: payment,
      paymentStatus: "Success",
      discount: couponDiscount,
    });
    req.session.user_name = username;
    req.session.order_ID = orderID;
    req.session.order_Date = OrderDate;
    req.session.initial_status = status[0];
    req.session.payment_mode = payment;
    await productOrderByUser.save();
    console.log("USER made a ORDER");
    await cartModel.updateOne({ user: userID }, { $set: { item: [] } });
    await userModel.updateOne(
      { username: username },
      { $push: { coupon: req.session.couponUserUSed } }
    );
    if (req.query.addressID) {
      res.redirect("/orderPlaced");
    } else if (req.body.addressID) {
      res.json({ message: "product ordered successfully" });
    }

    //----------------------------------------------
    // Decrease the respective product stock when an order is made.
    let dataForReducingStock = await orderModel.aggregate([
      { $match: { orderID: orderID } },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 0,
          productName: "$products.product_name",
          productID: "$products.product",
          productCartQuantity: "$products.product_quantity",
        },
      },
    ]);

    console.log("dataForReducingStock is: ", dataForReducingStock);

    dataForReducingStock.forEach(async (product) => {
      const result = await productModel.updateOne(
        {
          _id: new ObjectId(product.productID),
        },
        {
          $inc: { stock: -product.productCartQuantity },
        }
      );
    });
    //----------------------------------------------------------------
  } catch (error) {
    console.log(
      "Error while accessing orderProduct (ordercontroller) : " + error
    );
  }
};

const payby_Wallet = async (req, res) => {
  try {
    console.log("Wallet payment initiated");

    console.log(req.body);
    username = req.session.name;
    console.log(username);
    userID = req.session.userID;
    console.log(userID);
    const cart = await cartModel.find({ user: userID });
    const user = await userModel.findOne({ username: req.session.name });
    addressID = req.body.addressID;
    console.log(addressID);
    payment = req.body.payment;
    console.log(payment);
    amount = req.body.amount;
    console.log(amount);
    discount = req.body.discount;
    console.log(discount);
    initialStatus = "Placed";
    let a = orderIDGenerator();
    console.log("Order ID generated plus timestamp :", a);
    let orderID = a[0];
    console.log("Order ID alone :", orderID);
    console.log("Date is(timestamp)  ", a[1]);
    const OrderDate = new Date(a[1]).toDateString();
    console.log("DATE OF ORDER IS: (Date and Day) ", OrderDate);
    const Order_Date = new Date(a[1]);
    console.log("Usual Date is: ", Order_Date);

    let address = await addressModel.findOne(
      { _id: addressID },
      { _id: 0, user: 0 }
    );

    console.log("Address details:", address);
    userOrderDetails = req.session.userCheckOutProductList;
    paymentMethod = payment;

    console.log("______________________");
    console.log("Payment method is:", paymentMethod);
    // // console.log("Address ID for the order is: ", req.body.address);
    console.log("Address details are:", address);
    console.log("User name: " + username);
    console.log("Initial status when product is ordered :", initialStatus);
    console.log("Checkout value: ", amount);
    console.log("Order ID:", orderID);
    console.log("Order date is:", Order_Date);
    console.log("User order product details:", userOrderDetails);
    console.log("cart value:", cart);
    console.log("Coupon discount :", discount);

    console.log(cart[0].item);

    console.log("______________________");
    // let ab;
    // console.log(
    //   "Cart value after using coupon is: ",
    //   req.session.cart_Value_after_coupon
    // );
    // if (req.session.cart_Value_after_coupon) {
    //   ab = req.session.cart_Value_after_coupon;
    // } else ab = req.session.totalCheckoutCharge;

    let productOrderByUserWallet = new orderModel({
      orderID: orderID,
      user: username,
      date: Order_Date,
      products: cart[0].item,
      address: address,
      totalOrderValue: amount,
      status: initialStatus,
      paymentMethod: payment,
      paymentStatus: "Success",
      discount: discount,
    });
    req.session.user_name = username;
    req.session.order_ID = orderID;
    req.session.order_Date = OrderDate;
    req.session.initial_status = initialStatus;
    req.session.payment_mode = payment;
    await productOrderByUserWallet.save();
    console.log("USER made a ORDER by Wallet");
    await cartModel.updateOne({ user: userID }, { $set: { item: [] } });

    // console.log("Total amount is: ", ab);

    const walletTransactions = {
      date: new Date(),
      type: "Debit",
      amount: amount,
    };

    await walletModel.updateOne(
      { userId: userID },
      {
        $inc: { wallet: -amount },
        $push: { walletTransactions: walletTransactions },
      }
    );

    await userModel.updateOne(
      { username: username },
      { $push: { coupon: req.session.couponUserUSed } }
    );

    res.json({ message: "product ordered successfully via wallet payment" });
    console.log("$$$$---------------%^&^^^*&***&76660000");
  } catch (error) {
    console.log("Error happened between payby_Wallet in orderController");
  }
};

const orderPlaced = async (req, res) => {
  try {
    console.log("ORderplaced page");
    userID = req.session.userID;

    //Below  if loop works only when we retry razorpay payment, else it will directly render the below mentioned page//
    if (req.query.statuss) {
      console.log("Status passed as query:", req.query.statuss);
      console.log(
        "Order Id kept in session from repay is: ",
        req.session.orderid_in_repay
      );

      req.session.initial_status = "Placed";

      await orderModel.updateOne(
        { orderID: req.session.orderid_in_repay },
        { $set: { status: "Placed", paymentStatus: "Success" } }
      );
    } else if (req.query.payment) {
      console.log("payment success passed as query: ", req.query.payment);
      console.log(
        "Order Id kept in session from repay is: ",
        req.session.orderID_OrderPage
      );
      req.session.initial_status = "Placed";
      await orderModel.updateOne(
        { orderID: req.session.orderID_OrderPage },
        { $set: { status: "Placed", paymentStatus: "Success" } }
      );
    }

    await cartModel.updateOne({ user: userID }, { $set: { item: [] } });
    // console.log("Testing for order getting or not after repayment  ", test);

    res.render("userOrderPlaced", {
      user: req.session.user_name,
      orderID: req.session.order_ID,
      OrderDate: req.session.order_Date,
      initialStatus: req.session.initial_status,
      paymentMethod: req.session.payment_mode,
    });
  } catch (error) {
    console.log("Error when orderPlaced in orderController: ", error);
  }
};

const userEachOrderData = async (req, res) => {
  try {
    console.log("ORDER DETAILS PAGE");
    const id = req.params.id;
    console.log("ORDER ID is: ", id);
    username = req.session.name;

    const eachOrderDetails = await orderModel.findOne({ orderID: id });
    console.log("Each order Details:", eachOrderDetails);
    console.log(eachOrderDetails.products.length);

    // const data = eachOrderDetails.products.map((Value) => {
    //   console.log("Value is:", Value);
    //   return Value;
    // });
    // console.log("DATA IS: ", data);

    let orderData = await orderModel.aggregate([
      { $match: { orderID: id } },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 0,
          date: 1,
          productName: "$productDetails.name",
          productImage: { $arrayElemAt: ["$productDetails.image", 0] },
          productPrice: "$productDetails.rate_after_discount",
          productStatus: "$products.status",
          productID: "$products.product",
          productCartQuantity: "$products.product_quantity",
          total: {
            $multiply: [
              "$productDetails.rate_after_discount",
              "$products.product_quantity",
            ],
          },
        },
      },
    ]);
    console.log("ORDER DATA USING AGGREGATION IS:", orderData);

    console.log("USER IN ORDER DETAILS PAGE");

    res.render("userOrderDetailsPage", { orderData, eachOrderDetails });
  } catch (error) {
    console.log(
      "Error happened in userEachOrderData in orderController",
      error
    );
  }
};

const payByRazorpay = async (req, res) => {
  try {
    console.log("pay by razorpay");
    console.log(req.body);
    console.log(req.body.amount);
    console.log(req.body.discount);

    // console.log(req.session.totalCheckoutCharge);
    // console.log(req.session.cart_Value_after_coupon);
    let amount = req.body.amount * 100;
    if (req.body.discount == 0) {
      req.session.discount_using_razorpay = 0;
    } else if (req.body.discount > 0) {
      req.session.discount_using_razorpay = req.body.discount;
    }

    console.log("The checkout amount is :", amount);
    req.session.amount_using_razorpay = amount;
    console.log(
      "The coupon discount is: ",
      req.session.discount_using_razorpay
    );

    // if (req.session.cart_Value_after_coupon == undefined) {
    //   amount = req.session.totalCheckoutCharge * 100;
    // } else if (req.session.cart_Value_after_coupon) {
    //   amount = req.session.cart_Value_after_coupon * 100;
    // }
    // // const amount = req.session.cart_Value_after_coupon;
    // // if (req.session.cart_Value_after_coupon) {
    // //   amount = req.session.totalCheckoutCharge * 100;
    // // } else if (!req.session.cart_Value_after_coupon) {
    // //   amount = req.session.totalCheckoutCharge * 100;
    // // }
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      console.log(err);
      console.log(order);
      if (!err) {
        res.status(200).send({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: process.env.RAZORPAY_ID_KEY,
          // product_name: req.body.name,
          // description: req.body.description,
          // contact: "8567345632",
          name: "getantiques",
          email: "getantiques@gmail.com",
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

const razorpayPaymentFailed = async (req, res) => {
  try {
    console.log("-----razorpayPaymentFailed------------");
    username = req.session.name;
    userID = req.session.userID;

    const cart = await cartModel.find({ user: userID });
    const user = await userModel.findOne({ username: req.session.name });

    console.log("req.query is:", req.query);

    let orderData = orderIDGenerator();
    console.log("orderData is: ", orderData);
    const orderID = orderData[0];
    console.log("order ID: ", orderID);

    console.log("order timestamp is: ", orderData[1]);
    const date = new Date(orderData[1]);
    console.log("Date is: ", date);
    let addressID = req.query.addressID;
    let payment = req.query.payment;
    amount = req.session.amount_using_razorpay / 100;
    discount = req.session.discount_using_razorpay;

    // console.log("address id is: ", addressID);
    // console.log("payment method is: ", payment);
    initialStatus = "Failed";
    let address = await addressModel.findOne(
      { _id: addressID },
      { _id: 0, user: 0 }
    );
    userOrderDetails = req.session.userCheckOutProductList;

    console.log("______________________");
    console.log("Payment method is:", payment);
    console.log("Discount is: ", discount);
    console.log("Amount is: ", amount);
    console.log("Address ID for the order is: ", addressID);
    console.log("Address details :", address);
    console.log("User name: " + username);
    console.log("Status :", initialStatus);
    // console.log("Checkout value: " + req.session.totalCheckoutCharge);
    console.log("Order ID:", orderID);
    console.log("Order date is:", date);
    console.log("User order product details:", userOrderDetails);
    console.log("cart value:", cart);
    console.log("USER details is:" + user);

    console.log("______________________");

    // let ab;
    // console.log(
    //   "Cart value after using coupon is: ",
    //   req.session.cart_Value_after_coupon
    // );
    // if (req.session.cart_Value_after_coupon) {
    //   ab = req.session.cart_Value_after_coupon;
    // } else ab = req.session.totalCheckoutCharge;

    let productOrderByUser = new orderModel({
      orderID: orderID,
      user: username,
      date: date,
      products: cart[0].item,
      address: address,
      discount: discount,
      totalOrderValue: amount,
      status: initialStatus,
      paymentMethod: payment,
      paymentStatus: "Failed",
    });
    req.session.user_name = username;
    req.session.order_ID = orderID;
    req.session.order_Date = date;
    req.session.initial_status = initialStatus;
    req.session.payment_mode = payment;
    await productOrderByUser.save();
    let value = await orderModel.find({ orderID: orderID });
    console.log(value);
    console.log(value[0].products);
    console.log("98977uhvhhggjkbiuihuiucvhkbvg");
    value[0].products.forEach((update) => {
      update.status = "Failed";
    });

    console.log(value[0].products);
    console.log("PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP");
    //cart[0].item.forEach((value) => {
    // //   value.test = "Placed";
    // //   console.log(value);
    // // });

    console.log("ORDER SAVED WHILE PAYMENT FAILED");

    res.render("razorpayFailed", {
      user: req.session.name,
      orderID,
      date,
      amount,
    });
  } catch (error) {
    console.log(
      "Error happened while razorpayPaymentFailed in orderController ",
      error
    );
  }
};

const reRazorpay = async (req, res) => {
  try {
    console.log("reRazorpay invoked");
    console.log(req.body.orderID);

    const splitValues = req.body.orderID.split("-");
    let orderID = splitValues[0];
    let amount = splitValues[1] * 100;
    console.log("Order ID is :", orderID);
    console.log("Amount is:", amount);
    req.session.orderid_in_repay = orderID;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      console.log(err);
      console.log(order);
      if (!err) {
        res.status(200).send({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: process.env.RAZORPAY_ID_KEY,
          product_name: req.body.name,
          description: req.body.description,
          contact: "8567345632",
          name: "getantiques",
          email: "getantiques@gmail.com",
        });
      } else {
        res.status(400).send({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log("error happened between reRazorpay in orderController.", error);
  }
};

const payRazorpay_Order_Page = async (req, res) => {
  try {
    console.log("Razorpay initiated from order page for failed order");
    console.log("Order id is: ", req.body.orderID);

    req.session.orderID_OrderPage = req.body.orderID;

    const data = await orderModel.findOne(
      { orderID: req.body.orderID },
      { _id: 0, totalOrderValue: 1 }
    );

    amount = data.totalOrderValue * 100;

    console.log("Amount is:", amount);
    // req.session.orderid_in_repay = orderID;

    const options = {
      amount: amount,
      currency: "INR",
      receipt: "razorUser@gmail.com",
    };

    razorpayInstance.orders.create(options, (err, order) => {
      console.log(err);
      console.log("---mmmmm-----nnnnn", order);
      if (!err) {
        res.status(200).send({
          success: true,
          msg: "Order Created",
          order_id: order.id,
          amount: amount,
          key_id: process.env.RAZORPAY_ID_KEY,
          product_name: req.body.name,
          description: req.body.description,
          contact: "8567345632",
          name: "getantiques",
          email: "getantiques@gmail.com",
        });
      } else {
        res.status(400).send({ success: false, msg: "Something went wrong!" });
      }
    });
  } catch (error) {
    console.log(
      "Error happened between payRazorpay_order in orderController",
      error
    );
  }
};

const discard_Online_Payment = async (req, res) => {
  try {
    console.log("Discard Razorpay failed transaction");
    console.log(req.body);
    console.log(req.session.user_Applied_Coupon);
  } catch (error) {
    console.log(
      "error happened between discard_Online_Payment in orderController.",
      error
    );
  }
};

const productReturn = async (req, res) => {
  try {
    console.log("**************---Product Return---***************");
    console.log(req.body.reason);
    console.log(req.params.id);
    console.log(req.query.product);

    returnDate = new Date();

    let productUpdate = await orderModel.updateOne(
      {
        orderID: req.params.id,
        "products.product": new ObjectId(req.query.product),
      },
      {
        $set: {
          "products.$.status": "Return Initiated",
          "products.$.reason": req.body.reason,
          "products.$.returnDate": returnDate,
        },
      },
      { upsert: true }
    );
    console.log("Order Update is: ", productUpdate);
    res.redirect(`/account/order`);
  } catch (error) {
    console.log("Error happened while productReturn in orderController", error);
  }
};

const cancelProduct = async (req, res) => {
  try {
    console.log("**************---Cancel Product---***************");
    console.log(req.body);
    console.log("User name is: ", req.session.name);
    let userID = await userModel.findOne(
      { username: req.session.name },
      { _id: 1 }
    );
    console.log("User ID is: ", userID._id);

    let userWallet = await walletModel.findOne({ userId: userID._id });
    console.log("User wallet details: ", userWallet);

    // find the product price to credit to wallet//
    let productPrice = await orderModel.aggregate([
      {
        $match: { orderID: req.body.orderID },
      },
      { $unwind: "$products" },
      {
        $match: { "products.product": new ObjectId(req.body.productId) },
      },
      {
        $project: {
          "products.product_rate": 1,
          _id: 0,
        },
      },
    ]);
    console.log("Product price is: ", productPrice[0].products.product_rate);
    // product price end //

    let returnDetails = await orderModel.findOne(
      { orderID: req.body.orderID },
      { _id: 0, paymentMethod: 1 }
    );
    console.log("Order Payment mode: ", returnDetails.paymentMethod);

    if (
      returnDetails.paymentMethod == "Online" ||
      returnDetails.paymentMethod == "wallet"
    ) {
      console.log("Return money to wallet");

      walletTransactions = {
        date: new Date(),
        type: `Credited for cancelling ${req.body.orderID}`,
        amount: productPrice[0].products.product_rate,
      };

      let updateWallet = await walletModel.updateOne(
        { userId: userID._id },
        {
          $inc: { wallet: +productPrice[0].products.product_rate },
          $push: { walletTransactions: walletTransactions },
        }
      );

      console.log(updateWallet);
    } else {
      console.log("No return of amount needed");
    }

    let orderUpdate = await orderModel.updateOne(
      {
        orderID: req.body.orderID,
        "products.product": new ObjectId(req.body.productId),
      },
      {
        $set: { "products.$.status": "Cancelled" },
      }
    );
    console.log("Order Update is: ", orderUpdate);

    //----------------------------------------------
    // Increase the respective product stock when an order is made.
    let dataForIncreasingStock = await orderModel.aggregate([
      { $match: { orderID: req.body.orderID } },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "products",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $project: {
          _id: 0,
          productName: "$products.product_name",
          productID: "$products.product",
          productCartQuantity: "$products.product_quantity",
        },
      },
    ]);

    console.log("dataForIncreasingStock is: ", dataForIncreasingStock);

    dataForIncreasingStock.forEach(async (product) => {
      const result = await productModel.updateOne(
        {
          _id: new ObjectId(product.productID),
        },
        {
          $inc: { stock: product.productCartQuantity },
        }
      );
    });
    //----------------------------------------------------------------

    res.json({ message: "This product is cancelled." });
  } catch (error) {
    console.log(
      "Error happened between cancelProduct in orderController",
      error
    );
  }
};

const cancelOrder = async (req, res) => {
  try {
    console.log("cancel order");
    const orderId = req.params.id;
    console.log("Order id is: ", orderId);
    await orderModel.updateOne(
      { orderID: orderId },
      { $set: { status: "Cancelled" } }
    );
    const data = await orderModel.findOne(
      { orderID: orderId },
      { _id: 0, paymentMethod: 1, totalOrderValue: 1, user: 1 }
    );

    console.log("This shows data:, ", data);
    let wallet;
    let returnAmount;

    if (data.paymentMethod == "Online") {
      returnAmount = data.totalOrderValue - 1000;
      await userModel.updateOne(
        { username: data.user },
        { $inc: { wallet: returnAmount } }
      );

      console.log("Wallet credited.");
    }
    console.log("Order cancelled by user");
    const orderDetails = await orderModel.findOne({ orderID: orderId });
    console.log("Order Details of cancelled order is: ", orderDetails);
    res.redirect(`/account/order?message=Order-cancelled`);
  } catch (error) {
    console.log("Error happened in cancelOrder in orderController");
  }
};

const addressCheckInCheckout = async (req, res) => {
  try {
    console.log("addressCheckInCheckout");
    console.log(req.body.userName);
    const userID = await userModel.findOne(
      { username: req.body.userName },
      { _id: 1 }
    );
    console.log("User ID is: ", userID);

    const checkAddress = await addressModel.find({
      user: userID._id,
    });

    console.log("checkAddress is: ", checkAddress);
    if (checkAddress.length == 0) {
      res.json({ message: "Please add an address to proceed." });
      console.log("No address added");
    }
    //  else {
    //   res.json({ message: "Address available", value: 1 });
    //   console.log("User has address added already");
    // }
  } catch (error) {
    console.log(
      "Error happened between addressCheckInCheckout in orderController ",
      error
    );
  }
};

const invoice = async (req, res) => {
  try {
    console.log("Invoice ---------->>>");
    console.log(req.query.orderId);

    const orderData = await orderModel.findOne({ orderID: req.query.orderId });

    console.log("Order Data for invoice is: ", orderData);
    date = orderData.date;
    console.log("Date is :", date.toDateString());

    //--------------------------------------------------------//

    const num = `${orderData.totalOrderValue}`;
    const wordify = (num) => {
      const single = [
        "Zero",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
      ];
      const double = [
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ];
      const tens = [
        "",
        "Ten",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ];
      const formatTenth = (digit, prev) => {
        return 0 == digit
          ? ""
          : " " + (1 == digit ? double[prev] : tens[digit]);
      };
      const formatOther = (digit, next, denom) => {
        return (
          (0 != digit && 1 != next ? " " + single[digit] : "") +
          (0 != next || digit > 0 ? " " + denom : "")
        );
      };
      let res = "";
      let index = 0;
      let digit = 0;
      let next = 0;
      let words = [];
      if (((num += ""), isNaN(parseInt(num)))) {
        res = "";
      } else if (parseInt(num) > 0 && num.length <= 10) {
        for (index = num.length - 1; index >= 0; index--)
          switch (
            ((digit = num[index] - 0),
            (next = index > 0 ? num[index - 1] - 0 : 0),
            num.length - index - 1)
          ) {
            case 0:
              words.push(formatOther(digit, next, ""));
              break;
            case 1:
              words.push(formatTenth(digit, num[index + 1]));
              break;
            case 2:
              words.push(
                0 != digit
                  ? " " +
                      single[digit] +
                      " Hundred" +
                      (0 != num[index + 1] && 0 != num[index + 2] ? " and" : "")
                  : ""
              );
              break;
            case 3:
              words.push(formatOther(digit, next, "Thousand"));
              break;
            case 4:
              words.push(formatTenth(digit, num[index + 1]));
              break;
            case 5:
              words.push(formatOther(digit, next, "Lakh"));
              break;
            case 6:
              words.push(formatTenth(digit, num[index + 1]));
              break;
            case 7:
              words.push(formatOther(digit, next, "Crore"));
              break;
            case 8:
              words.push(formatTenth(digit, num[index + 1]));
              break;
            case 9:
              words.push(
                0 != digit
                  ? " " +
                      single[digit] +
                      " Hundred" +
                      (0 != num[index + 1] || 0 != num[index + 2]
                        ? " and"
                        : " Crore")
                  : ""
              );
          }
        res = words.reverse().join("");
      } else res = "";
      return res;
    };
    console.log(wordify(num));

    //------------------------------------------------------------------//

    // copy
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice</title>
        <style>
            /! tailwindcss v3.0.12 | MIT License | https://tailwindcss.com/,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:initial}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:initial;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:initial}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input:-ms-input-placeholder,textarea:-ms-input-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none},:after,:before{--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:#3b82f680;--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: }.flex{display:flex}.table{display:table}.table-cell{display:table-cell}.table-header-group{display:table-header-group}.table-row-group{display:table-row-group}.table-row{display:table-row}.hidden{display:none}.w-60{width:15rem}.w-40{width:10rem}.w-full{width:100%}.w-\[12rem\]{width:12rem}.w-9\/12{width:75%}.w-3\/12{width:25%}.w-6\/12{width:50%}.w-2\/12{width:16.666667%}.w-\[10\%\]{width:10%}.flex-1{flex:1 1 0%}.flex-col{flex-direction:column}.items-start{align-items:flex-start}.items-end{align-items:flex-end}.justify-center{justify-content:center}.rounded-l-lg{border-top-left-radius:.5rem;border-bottom-left-radius:.5rem}.rounded-r-lg{border-top-right-radius:.5rem;border-bottom-right-radius:.5rem}.border-x-\[1px\]{border-left-width:1px;border-right-width:1px}.bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity))}.p-10{padding:2.5rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.px-4{padding-left:1rem;padding-right:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.pl-4{padding-left:1rem}.pb-20{padding-bottom:5rem}.pb-16{padding-bottom:4rem}.pb-1{padding-bottom:.25rem}.pb-2{padding-bottom:.5rem}.pt-20{padding-top:5rem}.pr-10{padding-right:2.5rem}.pl-24{padding-left:6rem}.pb-6{padding-bottom:1.5rem}.pl-10{padding-left:2.5rem}.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.text-4xl{font-size:2.25rem;line-height:2.5rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.font-bold{font-weight:700}.font-normal{font-weight:400}.text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity))}.text-gray-400{--tw-text-opacity:1;color:rgb(156 163 175/var(--tw-text-opacity))}.text-black{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity))}
        </style>
    </head>
    <body>
        <div class="p-10">
            <!--Logo and Other info-->
            <div class="flex items-start justify-center">
                <div class="flex-1">
                    <div class="w-60 pb-6">
                        <img class="w-40" src="https://scontent.fblr11-1.fna.fbcdn.net/v/t39.30808-6/435702532_7578278512231936_4307073485603164308_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=5f2048&_nc_ohc=LWkvtYjYiiYAb4s5ps1&_nc_ht=scontent.fblr11-1.fna&oh=00_AfDVkbC2zxBwanVI5al599uR_MDprwXMQVQzaSRAZN7H4g&oe=662314B2" alt="getantiques">
                    </div>
                    
                    <div class="w-60 pl-4 pb-6">
                        <h3 class="font-bold">getantiques</h3>
                        <p>12th cross, 80th feet Road</p>
                        <p>Indiranagar</p>
                        <p>Bangalore 560075</p>
                    </div>
                    
                    <div class="pl-4 pb-20">
                        <p class="text-gray-500">Shipping to:</p>
                        <h3 class="font-bold">${
                          orderData.address.customerName
                        }</h3>
                        <h3>${orderData.address.houseName}, ${
      orderData.address.street
    }, ${orderData.address.city}</h3>
                        <h3>${orderData.address.state}, ${
      orderData.address.pincode
    } - ${orderData.address.mobile}</h3>
                    </div>
                    
                </div>
                <div class="flex items-end flex-col">
    
                    <div class="pb-16">
                        <h1 class=" font-normal text-4xl pb-1">Invoice</h1>
                        <br><p class="text-right text-gray-500 text-xl"></p>
                        <p class="text-right text-gray-500 text-xl">#: ${
                          orderData.orderID
                        }</p>
                    </div>
    
                    <div class="flex">
                        <div class="flex flex-col items-end">
                            <p class="text-gray-500 py-1">Date: </p>
                            <p class="text-gray-500 py-1">Payment Method:</p>
                            
                        </div>
                        <div class="flex flex-col items-end w-[12rem] text-right">
                            <p class="py-1">${date.toDateString()}</p>
                            <p class="py-1 pl-10">${orderData.paymentMethod}</p>
                            
                        </div>
                    </div>
                </div>
            </div>
            
            <!--Items List-->
    <div class="table w-full">
                <div class=" table-header-group bg-gray-700 text-white ">
                    <div class=" table-row ">
                        <div class=" table-cell w-6/12 text-left py-2 px-4 rounded-l-lg border-x-[1px]">Item</div>
                        <div class=" table-cell w-[10%] text-center border-x-[1px]">Qty</div>
                        <div class=" table-cell w-2/12 text-center border-x-[1px]">Unit Price</div>
                        
                        <div class=" table-cell w-2/12 text-center rounded-r-lg border-x-[1px]">Amount</div>
                    </div>
                </div>
    
                <div class="table-row-group">
                    ${getDeliveryItemsHTML(orderData)}
                </div>
            </div>
            
            <!--Total Amount-->
            <div class=" pt-10 pr-10 text-right">
                <p class="text-gray-400">Sub total: <span class="pl-24 text-black">₹${
                  orderData.totalOrderValue - 1000
                }</span></p>
            </div>
            <div class=" pt-10 pr-10 text-right">
                <p class="text-gray-400">Delivery: <span class="pl-24 text-black">₹1000
              </span></p>
            </div>
            <div class=" pt-20 pr-10 text-right">
                <p class="text-gray-400">Total: <span class="pl-24 text-black">₹${
                  orderData.totalOrderValue
                }
              </span></p>
            </div>

            <div class=" pt-10 pr-10 text-left">
                <p class="text-gray-400">Amount in Words: <span class="pl-24 text-black">${wordify(
                  num
                )}</span></p>
            </div> 
    
            <!--Notes and Other info-->
            <div class="py-6">
            <br>
                <p class="text-gray-400 pb-2">Notes: <span>Thanks for ordering with us.</span></p> </div>
    
            <div class="">
                <p class="text-gray-400 pb-2">Terms: <span style="font-size:8px;">Invoice is Auto generated at the time of delivery,if there is any issue contact provider.</span></p>
                
            </div>
        </div>
    </body>
    </html>
    `;

    function getDeliveryItemsHTML(orderData) {
      let data = "";
      orderData.products.forEach((value) => {
        data += `
    <div class="table-row">
        <div class=" table-cell w-6/12 text-left font-bold py-1 px-4">${
          value.product_name
        }</div>
        <div class=" table-cell w-[10%] text-center">${
          value.product_quantity
        }</div>
        <div class=" table-cell w-2/12 text-center">₹${value.product_rate}</div>
        <div class=" table-cell w-2/12 text-center">₹${
          value.product_rate * value.product_quantity
        }</div>
    </div>
    `;
      });
      return data;
    }

    const browser = await puppeteer.launch({
      // executablePath:'/usr/bin/chromium-browser'
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf();

    await browser.close();

    // const downloadsPath = path.join(os.homedir(), "Downloads");
    // const pdfFilePath = path.join(downloadsPath, "invoice.pdf");

    // fs.writeFileSync(pdfFilePath, pdfBuffer);

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=getantiques-invoice.pdf"
    );
    res.status(200).end(pdfBuffer);
    // copy
  } catch (error) {
    console.log("Error happened between invoice in orderController", error);
  }
};

module.exports = {
  orderPage,
  userOrder,
  cashOnDelivery,
  userEachOrderData,
  payByRazorpay,
  razorpayPaymentFailed,
  reRazorpay,
  payRazorpay_Order_Page,
  discard_Online_Payment,
  adminOrderDetails,
  orderPlaced,
  cancelOrder,
  cancelProduct,
  productReturn,
  addressCheckInCheckout,
  payby_Wallet,
  check_order_returns,
  invoice,
};
