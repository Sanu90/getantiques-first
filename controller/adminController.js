const { name } = require("ejs");
const userModel = require("../model/userModel");
const catModel = require("../model/categoryModel");
const prodModel = require("../model/productModel");
const bcrypt = require("bcrypt");

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
        req.session.name = req.body.name;
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

const admintoDash = (req, res) => {
  try {
    res.render("admin_dashboard", { name: req.session.name });
    console.log("Name is:" + req.session.name);
    console.log("ADMIN: DASHBOARD");
  } catch (error) {
    console.log("Error while accessing  admin Dash: " + error);
  }
};

const adminShowUsers = async (req, res) => {
  try {
    var users = await userModel
      .find({ isAdmin: 0 })
      .sort({ username: -1 }); /*   */
    if (req.session.userData) {
      users = req.session.userData;
    }

    res.render("admin_showUsers", { name: req.session.name, users });
    console.log("ADMIN: USERS");
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
};
