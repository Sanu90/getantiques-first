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

const chartData = async (req, res) => {
  try {
    console.log("Daily chart rendered");
    const Aggregation = await orderModel.aggregate([
      {
        $match: {
          date: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);
    res.json(Aggregation);
  } catch (error) {
    console.log("Error while chartdata in adminController", error);
  }
};

const chartDataYear = async (req, res) => {
  try {
    console.log("Yearly Chart rendered");
    const Aggregation = await orderModel.aggregate([
      {
        $match: {
          date: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
        },
      },
    ]);
    res.json(Aggregation);
  } catch (error) {
    console.log("Error while chartDataYear in adminController", error);
  }
};

const chartDataMonth = async (req, res) => {
  try {
    console.log("Monthly chart rendered");
    const Aggregation = await orderModel.aggregate([
      {
        $match: {
          date: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);
    res.json(Aggregation);
  } catch (error) {
    console.log("Error while chartDataMonth in adminController", error);
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

    // const sum_of_revenue = await orderModel.aggregate([
    //   { $unwind: "$products" },
    //   {
    //     $match: {
    //       "products.status": "Delivered",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       revenue: {
    //         $sum: "$totalOrderValue",
    //       },
    //     },
    //   },
    // ]);

    const totalRevenue = await orderModel.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.status": "Delivered",
        },
      },

      {
        $project: {
          amount: {
            $multiply: ["$products.product_quantity", "$products.product_rate"],
          },
        },
      },
      {
        $group: {
          _id: "",
          total_revenue: { $sum: "$amount" },
        },
      },
    ]);

    //console.log("Total Revenue for dashboard is: ", totalRevenue);

    const productStatus = await orderModel.aggregate([
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.status": {
            $in: ["Delivered", "Placed", "Out for Delivery"],
          },
        },
      },
      {
        $group: {
          _id: "$products.status",
          count: { $sum: 1 },
        },
      },
    ]);

    //console.log(productStatus, "Status is:");

    const transaction = await orderModel.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    //console.log("transaction count is: ", transaction);

    const Product = await orderModel.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.product_name",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 4,
      },
    ]);
    console.log("Each Product ordered details:", Product);

    const dataForCategory = await orderModel.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.product_name",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
    ]);

    console.log("dataForCategory", dataForCategory);
    console.log("****$$$$$******");
    dataForCategory.forEach((value) => {
      return prodModel.find({ name: value._id });
    });

    res.render("admin_dashboard", {
      name: req.session.adminName,
      orderData,
      totalRevenue,
      productData,
      categoryData,
      productStatus,
      transaction,
      Product,
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
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;
    var count = await userModel.find({ isAdmin: 0 }).count();
    console.log(users);
    var users = await userModel
      .find({ isAdmin: 0 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ username: -1 });

    if (req.session.userData) {
      users = req.session.userData;
    }

    const totalPages = Math.ceil(count / limit);
    res.render("admin_showUsers", {
      name: req.session.adminName,
      users,
      totalPages,
      currentPage: page,
    });
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
        $match: { "products.status": "Delivered" },
      },
      {
        $group: {
          _id: "$products.product_name",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { totalOrders: -1 },
      },
      {
        $limit: 3,
      },
    ]);

    console.log("Product details:", Product);

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

    //console.log("Status is:--------?><<><<<<M ", status);

    const couponDiscounts = await orderModel.aggregate([
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
        $match: { "products.status": "Delivered" },
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
        },
      },
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.status": "Delivered",
        },
      },

      {
        $project: {
          amount: {
            $multiply: ["$products.product_quantity", "$products.product_rate"],
          },
        },
      },
      {
        $group: {
          _id: "",
          total_revenue: { $sum: "$amount" },
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
        },
      },
      {
        $unwind: "$products",
      },
      {
        $match: {
          "products.status": "Delivered",
        },
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
    // console.log("total_offer_reductions is:-->", total_offer_reductions);
    // console.log("total_offer_reductions is ", offer_discount);

    const orderData = await orderModel.aggregate([
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
        $match: { "products.status": "Delivered" },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    //console.log("Order Data within the date range is: ", orderData);
    //console.log(orderData.length);

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
                    <h3>Orders  </h3>
                        <table style="border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="border: 1px solid #000; padding: 8px;">#</th>
                                    <th style="border: 1px solid #000; padding: 8px;">User</th>
                                    <th style="border: 1px solid #000; padding: 8px;">DoO</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Order ID</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Shipped to</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Product Name</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Rate</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Qty</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Offer any</th>
                                    <th style="border: 1px solid #000; padding: 8px;">Paid By</th>

                                    <th style="border: 1px solid #000; padding: 8px;">DoD</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderData.map(
                                  (item, index) => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding-left: 8px;">${
                                          index + 1
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.user
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${item.date.toLocaleDateString()}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.orderID
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.address.customerName
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.products.product_name
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.products.product_rate
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.products.product_quantity
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.products
                                            .product_rate_before_discount -
                                          item.products.product_rate
                                        }</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.paymentMethod
                                        }</td>

                                        <td style="border: 1px solid #000; padding: 8px;">${
                                          item.products.date
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
                      revenue[0].total_revenue
                    }</span></h3>
                    </center>
                    <p style="padding-left:20px;">Summary:<br>A total  of ${
                      orderData.length
                    } products has been delivered. Total revenue generated is worth ₹ ${
      revenue[0].total_revenue
    }. An amount of ₹ ${
      couponDiscounts[0].couponDiscount
    } was provided as coupon discount and offer price in the terms of product/category offer was sum up to ${offer_discount}. </p>
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
      "attachment; filename=getantiques-Sales.pdf"
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
    console.log("status is:", status);

    await orderModel.updateOne(
      {
        orderID: orderID,
        "products.product": new ObjectId(productID),
      },
      {
        $set: { "products.$.status": status },
      }
    );

    if (status == "Delivered") {
      await orderModel.updateOne(
        {
          orderID: orderID,
          "products.product": new ObjectId(productID),
        },
        {
          $set: {
            "products.$.date": new Date(),
          },
        }
      );

      const test = await orderModel.aggregate([
        { $match: { orderID: orderID } },
        { $project: { products: 1, _id: 0 } },
      ]);

      console.log("Test is: ", test);
      let lengthh = test[0].products.length;
      console.log("Length is :", lengthh);
      let count = 0;
      for (let i = 0; i < lengthh; i++) {
        console.log("-----------------", test[0].products[i].status);
        if (test[0].products[i].status == "Delivered") count += 1;
      }
      console.log("Count is: ", count);

      if (count == lengthh) {
        await orderModel.updateOne(
          { orderID: orderID },
          { $set: { status: "Delivered" } }
        );
      }
    }

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
  chartData,
  chartDataYear,
  chartDataMonth,
};
