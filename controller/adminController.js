const { name } = require("ejs");
const userModel = require("../model/userModel");
const catModel = require("../model/categoryModel");
const prodModel = require("../model/productModel");
const orderModel = require("../model/orderModel");
const walletModel = require("../model/walletModel");
const bcrypt = require("bcrypt");
const puppeteer = require("puppeteer");
const fs = require("fs");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const adminLoginPage = (req, res) => {
  try {
    if (req.session.isAdmin) {
      console.log("Active admin");
      res.redirect("/admin/dashboard");
    } else {
      const error = req.query.error;
      // const message = req.session.adminError;
      // const invalidAdmin = req.session.invalidAdmin;
      console.log("ADMIN NEEDED TO LOGIN");
      res.render("admin_login", { error });
    }
  } catch (error) {
    console.log("Admin login page error: " + error);
  }
};

const adminDashboard = async (req, res) => {
  try {
    const Name = req.body.name;
    const adminData = await userModel.findOne({ username: Name });
    console.log(adminData);
    if (adminData && adminData.isAdmin == 1) {
      password = await bcrypt.compare(req.body.pass, adminData.password);
      if (password) {
        req.session.isAdmin = true;
        req.session.adminName = req.body.name;
        res.redirect("/admin/dashboard");
      } else {
        res.redirect("/admin?error=Invalid password");
      }
    } else {
      res.redirect("/admin?error=Not authorized");
    }
  } catch (error) {
    console.log("Admin Dashboard error: " + error);
  }
};

const admintoDash = async (req, res) => {
  try {
    const orderData = await orderModel.find({});
    const productData = await prodModel.find({});
    const categoryData = await catModel.find({});
    console.log("All order data:", orderData);
    console.log(orderData.length);
    console.log(productData.length);
    let sum_of_revenue = 0;
    for (let i = 0; i < orderData.length; i++) {
      sum_of_revenue = sum_of_revenue + orderData[i].totalOrderValue;
    }
    console.log("Total revenue from orders made is:", sum_of_revenue);

    const orderPlacedCount = await orderModel
      .find({ status: "Placed" })
      .countDocuments();
    console.log("Order count of Placed is: ", orderPlacedCount);

    const orderCancelledCount = await orderModel
      .find({ status: "Cancelled" })
      .countDocuments();
    console.log("Order count of Cancelled is: ", orderCancelledCount);

    const orderOFDCount = await orderModel
      .find({ status: "Out for Delivery" })
      .countDocuments();
    console.log("Order count of Out for Delivery is: ", orderOFDCount);

    const orderDeliveredCount = await orderModel
      .find({ status: "Delivered" })
      .countDocuments();
    console.log("Order count of Delivered is: ", orderDeliveredCount);

    const orderShippedCount = await orderModel
      .find({ status: "Shipped" })
      .countDocuments();
    console.log("Order count of Shipped is: ", orderShippedCount);

    res.render("admin_dashboard", {
      name: req.session.adminName,
      orderData,
      sum_of_revenue,
      productData,
      categoryData,
      orderPlacedCount,
      orderCancelledCount,
      orderOFDCount,
      orderDeliveredCount,
      orderShippedCount,
    });
    console.log("Name is:" + req.session.adminName);
    console.log("ADMIN: DASHBOARD");
  } catch (error) {
    console.log("Error while accessing  admin Dash: " + error);
  }
};

const adminShowUsers = async (req, res) => {
  try {
    console.log("ADMIN: USERS");
    var users = await userModel
      .find({ isAdmin: 0 })
      .sort({ username: -1 }); /*   */
    if (req.session.userData) {
      users = req.session.userData;
    }
    console.log("************");
    console.log(users[0].hide, users[1].hide);
    console.log("************");

    res.render("admin_showUsers", { name: req.session.adminName, users });
  } catch (error) {
    console.log("Error while Admin showing user data: " + error);
  }
};

const searchCat = async (req, res) => {
  try {
    const searchCatName = req.body.searchCat;
    console.log(searchCatName);
    const data = await catModel.find(
      {
        name: { $regex: new RegExp(searchCatName, "i") },
      },
      { isAdmin: 0 }
    );
    console.log("Searched category is :" + data);
    req.session.data = data;
    req.session.search = searchCatName;

    res.redirect("/admin/category");
    console.log("req.session.data is" + req.session.data);
  } catch (error) {
    console.log("Error while searching a category :" + error);
  }
};

const searchUser = async (req, res) => {
  try {
    const searchUserName = req.body.searchUser;
    console.log("User entered value is " + searchUserName);
    const userData = await userModel.find({
      username: { $regex: new RegExp(searchUserName, "i") },
    });
    console.log("Searched user is :" + userData);
    req.session.userData = userData;

    res.redirect("/admin/user");
    console.log("req.session.data is" + req.session.data);
  } catch (error) {
    console.log("Error while searching a user :" + error);
  }
};

const searchProduct = async (req, res) => {
  try {
    const searchProdName = req.body.searchProduct;
    console.log("admin searched for: -------  " + searchProdName);
    const prodData = await prodModel.find({
      name: { $regex: new RegExp(searchProdName, "i") },
    });
    console.log("Searched product is :" + prodData);
    req.session.prodData = prodData;
    //console.log(prodData[0]);
    res.redirect(`/admin/product`);
    //console.log("req.session.data is" + req.session.data);
  } catch (error) {
    console.log("Error while searching a product :" + error);
  }
};

const userHide = async (req, res) => {
  try {
    console.log(req.body.id);
    const data = await userModel.findOne({ _id: req.body.id });
    console.log("Error while blocking user :");
    if (data.hide == 0) {
      await userModel.updateOne({ _id: req.body.id }, { $set: { hide: 1 } });
      req.session.isUser = false;
    } else {
      await userModel.updateOne({ _id: req.body.id }, { $set: { hide: 0 } });
    }
    res.json({ success: true });
    console.log(data);
  } catch (error) {
    console.log("Error while hiding users: " + error);
  }
};

const adminSignout = (req, res) => {
  try {
    // req.session.isAdmin = false;
    req.session.isAdmin = false;
    //await req.session.destroy();
    console.log("BYE ADMIN");
    res.redirect("/admin");
  } catch (error) {
    console.log("Error while Admin signout: " + error);
  }
};

const salesReport = async (req, res) => {
  try {
    console.log("***salesReport***");
    const { startDate, endDate } = req.body;
    console.log("Start Date is:", startDate);
    console.log("End Date is:", endDate);

    const Product = await orderModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.product_name",
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    // console.log("Product details:", Product);

    const status = await orderModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.status",
          count: { $sum: 1 },
        },
      },
    ]);

    // console.log("Status is: ", status);

    const couponDiscounts = await orderModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          "products.status": {
            $nin: ["Return Rejected", "Return Accepted", "Cancelled"],
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "",
          couponDiscount: { $sum: "$discount" },
        },
      },
    ]);

    //console.log("Total Coupon Deductions made: ", couponDiscounts);

    const revenue = await orderModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          "products.status": {
            $nin: ["Failed", "Return Accepted", "Cancelled"],
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "",
          revenue: { $sum: "$totalOrderValue" },
        },
      },
    ]);

    //console.log("Total revenue is: ", revenue);

    const total_offer_reductions = await orderModel.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          "products.status": {
            $nin: ["Failed", "Return Accepted", "Cancelled"],
          },
        },
      },
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "",
          prbd: { $sum: "$products.product_rate_before_discount" },
          prad: { $sum: "$products.product_rate" },
        },
      },
    ]);

    let offer_discount =
      total_offer_reductions[0].prbd - total_offer_reductions[0].prad;

    console.log("total_offer_reductions is ", offer_discount);

    const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Sales Report - getantiques</title>
                    <style>
                        body {
                            margin-right: 20px;
                        }
                    </style>
                </head>
                <body>
                    <h2 align="center"> Sales Report  getantiques</h2>
                    From: ${startDate}<br>
                    To: ${endDate}<br>
                    <center>
                    <h3>Total Products Ordered</h3>
                        <table style="border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #000; padding: 8px;">#</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Product Name</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Orders</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Product.map(
                                  (item, index) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding-left: 8px;">${
                                          index + 1
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item._id
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.totalOrders
                                        }</td>
                                    </tr>`
                                )}

                            </tbody>
                        </table>
                    </center>
                    <br>
                    <center>
                    <h3>Order Status</h3>
                        <table style="border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #000; padding: 8px;">#</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Status</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${status.map(
                                  (item, index) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          index + 1
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item._id
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.count
                                        }</td>
                                    </tr>`
                                )}

                            </tbody>
                        </table>
                    </center>
                    <br>
                    <center>
                    <h3>Total coupon deductions made: <span>₹ ${
                      couponDiscounts[0].couponDiscount
                    }</span></h3>
                    <br>
                     <h3>Total Offer discounts: <span>₹ ${offer_discount}</span></h3>
                    <h3>Total Revenue generated: <span>₹ ${
                      revenue[0].revenue
                    }</span></h3>
                    </center>
                </body>
                </html>
            `;

    const browser = await puppeteer.launch({
      // executablePath: "/usr/bin/chromium-browser",
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf();

    await browser.close();

    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=getantiques.pdf"
    );
    res.status(200).end(pdfBuffer);
  } catch (error) {
    console.log(
      "Error happened between salesReport in adminController ",
      error
    );
  }
};

const approveReturnByAdmin = async (req, res) => {
  try {
    console.log("approveReturnByAdmin");
    console.log(req.body.orderID);
    console.log(req.body.what2do);
    console.log(req.body.productName);
    if (req.body.what2do == "approve") {
      await orderModel.updateOne(
        {
          orderID: req.body.orderID,
          "products.product_name": req.body.productName,
        },
        {
          $set: { "products.$.status": "Return Accepted" },
        }
      );

      //--------------------------------------------------------------//

      const username = await orderModel.findOne(
        { orderID: req.body.orderID },
        { _id: 0, user: 1 }
      );
      console.log("User name is: ", username.user);
      let userID = await userModel.findOne(
        { username: username.user },
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
          $match: { "products.product_name": req.body.productName },
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

      console.log("credit money to wallet when a product return is approved");

      walletTransactions = {
        date: new Date(),
        type: `Credit for return ${req.body.orderID}`,
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

      res.json({ message: "Return request accepted" });
      //-------------------------------------------------------------------//
    } else if (req.body.what2do == "reject") {
      console.log("code to reject the request to return an product");
      await orderModel.updateOne(
        {
          orderID: req.body.orderID,
          "products.product_name": req.body.productName,
        },
        {
          $set: { "products.$.status": "Return Rejected" },
        }
      );
      res.json({ message: "Return request rejected" });
    }
  } catch (error) {
    console.log(
      "Error happened between approveReturnByAdmin in adminController",
      error
    );
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    console.log("ADMIN updating updateOrderStatus");
    // console.log(req.body);
    const { orderID, productID, status } = req.body;
    console.log(orderID);
    console.log(productID);
    console.log(status);
    await orderModel.updateOne(
      {
        orderID: orderID,
        "products.product": new ObjectId(productID),
      },
      {
        $set: { "products.$.status": status },
      }
    );

    //console.log(productToBeUpdated);
    // await orderModel.updateOne(
    //   { orderID: orderID, "products.product": productID },
    //   { $set: { status: status } }
    // );
    res.redirect(`/admin/orderDetails?id=${orderID}`);
  } catch (error) {
    console.log(
      "Error happened while updateOrderStatus in adminController: ",
      error
    );
  }
};

module.exports = {
  adminLoginPage,
  adminDashboard,
  adminSignout,
  admintoDash,
  adminShowUsers,
  userHide,
  searchCat,
  searchUser,
  searchProduct,
  salesReport,
  updateOrderStatus,
  approveReturnByAdmin,
};
