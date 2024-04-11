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

      await cartModel.updateOne({ user: userID }, { $set: { item: [] } });
      // console.log("Testing for order getting or not after repayment  ", test);
    }

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
      totalOrderValue: amount - 1000,
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

module.exports = {
  orderPage,
  userOrder,
  cashOnDelivery,
  userEachOrderData,
  payByRazorpay,
  razorpayPaymentFailed,
  reRazorpay,
  discard_Online_Payment,
  adminOrderDetails,
  orderPlaced,
  cancelOrder,
  cancelProduct,
  productReturn,
  addressCheckInCheckout,
  payby_Wallet,
  check_order_returns,
};
