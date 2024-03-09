const userModel = require("../model/userModel");
const categoryModel = require("../model/categoryModel");
const productModel = require("../model/productModel");
const cartModel = require("../model/cartModel");
const addressModel = require("../model/userAddressModel");
const otpSend = require("../middleware/otp");
const bcrypt = require("bcrypt");
//const sendmail = require("../middleware/otp");

const indexPage = async (req, res) => {
  try {
    if (req.session.isUser) {
      res.redirect("/home");
    } else {
      const category = await categoryModel.find({});
      // const product1 = await productModel.find({}).sort({ _id: -1 }).limit(4);
      // const product2 = await productModel.find({}).skip(4).limit(4);
      const product1 = await productModel
        .find({ hide: 0 })
        .sort({ _id: -1 })
        .limit(4);
      const product2 = await productModel
        .find({ hide: 0 })
        .sort({ _id: 1 })
        .limit(4);
      console.log(category[0].name);
      res.render("index", { category, product1, product2 });
      console.log("INDEX PAGE");
    }
  } catch (error) {
    console.log("Error happened when rendering index page: " + error);
  }
};

const login = (req, res) => {
  try {
    if (req.session.isUser) {
      res.redirect("/home");
    } else {
      let message = req.session.error || req.session.logout;
      let success = req.query.success || req.session.passChange;

      res.render("login", { error: message, success });
      console.log("USER LOGIN PAGE");
    }
  } catch (error) {
    console.log("Error happened while user login: " + error);
  }
};

const register = (req, res) => {
  try {
    let error = req.query.error;
    res.render("register", { error });
    console.log("USER REGISTRATION PAGE");
  } catch (error) {
    console.log("Error while rendering user registration page: " + error);
  }
};

var OTP;
const toVerifyOTP = async (req, res) => {
  try {
    console.log(req.body);
    req.session.userDetails = req.body;
    const checkName = req.body.username;
    const checkUser = await userModel.find({ username: checkName });
    console.log("CheckUser using name is: " + checkUser);
    const checkEmail = req.body.email;
    const checkUser1 = await userModel.find({ email: checkEmail });
    console.log("CheckUser using email is: " + checkUser1);
    // const checkEmail = req.body.email;
    //console.log("CheckUser Email: " + checkUser[0].email);
    if (checkUser.length == 1) {
      console.log("111111111");
      res.redirect("/register?error=User already available");
      console.log("USERNAME ALREADY AVAILABLE");
    } else if (checkUser1.length == 1) {
      console.log("222222222222");
      res.redirect("/register?error=This-email-is-already-registered");
      console.log("EMAIL ALREADY AVAILABLE");
    } else if (checkUser.length == 0 && checkUser1.length == 0) {
      const email = req.body.email;
      console.log("sending otp to email for registration: " + email);
      const otpData = otpSend.sendmail(email); /////HERE IT IS////
      console.log("OTPDATA-----------------------" + otpData);
      OTP = otpData[0];
      // console.log("OTP received for registration: " + otpData[0]);
      // console.log("Timestamp for the OTP is: " + otpData[1]);
      req.session.otpTimestamp = otpData[1];
      message = req.session.otpError;
      res.render("otp", { message });
      // ---------------------------------->
      console.log("USER OTP PAGE");
    }
  } catch (err) {
    console.log("error in verifying otp" + err);
  }
};

const authOTP = async (req, res) => {
  try {
    console.log("OTP entered is " + req.body.otp);
    var timestamp = new Date().getTime();
    var otpTimestamp2 = Math.floor(timestamp / 1000);
    console.log("timestamp when OTP is entered :" + otpTimestamp2);
    //sendmail.sendmail;
    otpTimestamp1 = req.session.otpTimestamp;
    console.log("timestamp when OTP is triggered: " + otpTimestamp1);
    //console.log(req.body.otp);
    if (otpTimestamp2 - otpTimestamp1 > 32) {
      console.log("OTP time difference is :" + (otpTimestamp2 - otpTimestamp1));
      req.session.otpError = "OTP expired";
      message = req.session.otpError;
      console.log("OTP expired");
      let OTP = 1111;
      res.redirect("/otp");
      console.log(message);
    } else if (otpTimestamp2 - otpTimestamp1 < 32) {
      console.log("OTP time difference is :" + (otpTimestamp2 - otpTimestamp1));
      if (req.body.otp === OTP) {
        const bcryptPass = await bcrypt.hash(
          req.session.userDetails.password,
          10
        );
        console.log(req.session.userDetails);
        const registeredUser = new userModel({
          username: req.session.userDetails.username,
          password: bcryptPass,
          email: req.session.userDetails.email,
          mobile: req.session.userDetails.mobile,
          isAdmin: 0,
          hide: 0,
        });
        await registeredUser.save();
        console.log("--------------------------");
        console.log(req.session.userDetails.email);
        console.log("--------------------------");
        console.log("User OTP successfully verified");
        res.redirect("/login?success=Registered-Login now");
      } else {
        //message=req.session.message;
        req.session.otpError = "Invalid OTP entered";
        message = req.session.otpError;
        console.log("Invalid OTP entered by user");
        //res.redirect("/otp");
        res.render("otp");
        console.log(message);
      }
      console.log("Checking OTP");
    }
  } catch (err) {
    console.log("Error while authenticating OTP: " + err);
  }
};

const otp = (req, res) => {
  try {
    res.render("otp", { message });
  } catch (error) {
    console.log(
      "Error while displaying OTP page when wrong OTP entered by user :" + error
    );
  }
};

const resendOTP = (req, res) => {
  try {
    const email = req.session.userDetails.email;
    console.log("Resending OTP to email: " + email);
    const otpRData = otpSend.sendmail(email);
    console.log("otpRData is ++++++" + otpRData);
    OTP = otpRData[0];
    console.log(
      "OTP received after 30s is: " + OTP + " and timestamp is:  " + otpRData[1]
    );
    req.session.otpTimestamp = otpRData[1];
    message = req.session.otpError;
    res.redirect("/otp");
    console.log("USER RESEND OTP PAGE");
  } catch (error) {
    console.log("Error while resending OTP :" + error);
  }
};

const validateUser = async (req, res) => {
  try {
    const name = await req.body.username;
    req.session.sessionName = name;

    console.log(name);
    const userProfile = await userModel.findOne({ username: name });
    if (!userProfile) {
      req.session.error = "Not a registered user. Please register first";
      res.redirect("/login");
    } else if (userProfile) {
      const checkPass = await bcrypt.compare(
        req.body.pass,
        userProfile.password
      );
      console.log(checkPass);
      if (checkPass) {
        if (userProfile.hide == 0) {
          req.session.isUser = true;
          req.session.name = req.body.username;
          req.session.userID = userProfile._id;
          console.log("req.session.userID", req.session.userID);
          res.redirect("/home");
        } else {
          req.session.error = "You are not authorized. Contact Admin.";
          //console.log("hello222222222222");
          res.redirect("/login");
        }
      } else {
        req.session.error = "Incorrect password";
        console.log("hello222222222222");
        res.redirect("/login");
      }
    }
  } catch (err) {
    console.log("Error in validating user :" + err);
  }
};

const redirectUser = async (req, res) => {
  try {
    const userName = req.session.name;
    const category = await categoryModel.find({});
    const product1 = await productModel
      .find({ hide: 0 })
      .sort({ _id: -1 })
      .limit(4);
    const product2 = await productModel
      .find({ hide: 0 })
      .sort({ _id: -1 })
      .skip(4)
      .limit(4);

    console.log(userName);
    console.log("checkcheck chcek check");
    const cartProducts = await cartModel.find({ user: req.session.userID });
    console.log(cartProducts);
    if (cartProducts == "") {
      var cartCount = 0;
    }else{
      cartCount = cartProducts[0].item.length;
    console.log("cartCount is:", cartCount);
    }
    
    res.render("home", {
      category,
      product1,
      product2,
      user: userName,
      cartCount,
    });
  } catch (error) {
    console.log("Error while redirection in redirectUser (userController)");
  }
};

const forgotPassword = (req, res) => {
  try {
    res.render("forgotPassword", { error: req.session.noRegisteredEmail });
    console.log("USER IN FORGOT PASSWORD - EMAIL PAGE");
  } catch (error) {
    console.log("Error while redirecting to forgot password page :" + error);
  }
};

const authEmail = async (req, res) => {
  try {
    const email = req.body.email;
    req.session.emailDetail = req.body.email;
    console.log("User entered email: " + email);
    const emailAuth = await userModel.findOne({ email: email });
    console.log("emailAuth is: " + emailAuth);
    if (emailAuth === null) {
      console.log("User entered a non registered email");
      req.session.noRegisteredEmail = "This is not a registered email";
      error = req.session.noRegisteredEmail;
      res.redirect("/forgotPassword");
      //console.log(error);
    } else {
      req.session.USERdata = emailAuth.username;
      //console.log(req.session.USERdata);
      res.redirect("/forgotPassword/getOTP");
    }
  } catch (error) {
    console.log(
      "Error while authenticating email for password reset :" + error
    );
  }
};

var newOTP;
const fpGetOTP = (req, res) => {
  try {
    const fpEmail = req.session.emailDetail;
    fpOTP = req.session.invalidOTP;
    res.render("fpOTP", { fpEmail, fpOTP });
    console.log(
      "sending otp to registered email for password reset: " + fpEmail
    );
    const otpData = otpSend.sendmail(fpEmail);
    console.log(
      "password reset OTP received is:++++++++++++++++++++++++++++++++ " +
        otpData
    );
    newOTP = otpData[0];
  } catch (error) {
    console.log("Error in getting OTP for password reset :" + error);
  }
};

const fpAuthOTP = (req, res) => {
  try {
    if (req.body.otp === newOTP) {
      // console.log("*********************************************************");
      res.redirect("/changePassword");
    } else {
      fpEmail = req.session.emailDetail;
      req.session.invalidOTP = "Invalid OTP entered";
      fpOTP = req.session.invalidOTP;
      res.render("fpOTP", { fpEmail, fpOTP });
    }
  } catch (error) {
    console.log("Error in authenticating OTP for password change: " + error);
  }
};

const toChangePassword = (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    console.log("Error while redirected to change password :" + error);
  }
};

const updatePassword = async (req, res) => {
  try {
    const a = req.session.USERdata;
    console.log("a is-------->" + a);
    //let newPass = req.body.Password1
    let newPass = await bcrypt.hash(req.body.Password1, 10);
    console.log(newPass);
    await userModel.updateOne({ username: a }, { $set: { password: newPass } });
    req.session.passChange = "Password changed successfully. Login to proceed";
    res.redirect("/login");
  } catch (error) {
    console.log("Error while updating password :" + error);
  }
};

const productView = async (req, res) => {
  try {
    console.log("**********()()()()()()()()************");
    const id = req.params.id;
    req.session.productID = id;
    console.log("product id is: " + id);
    const category = await categoryModel.find({});
    const productDetails = await productModel.findOne({ _id: id });
    console.log("product category is: " + productDetails);
    const category_Data = await productModel.find({
      $and: [
        { category: productDetails.category },
        { _id: { $ne: productDetails._id } },
      ],
    });
    console.log(
      "Specific category data except the product seen in page :\n" +
        category_Data
    );
    res.render("productPage", {
      category,
      productDetails,
      available: "In Stock",
      notAvailable: "Out of Stock",
      category_Data,
    });
  } catch (error) {
    console.log("Error while displaying product page " + error);
  }
};

const userProductView = async (req, res) => {
  try {
    console.log("userProductView");
    const cartProducts = await cartModel.find({ user: req.session.userID });
    const cartCount = cartProducts[0].item.length;
    console.log("cartCount is:", cartCount);

    const id = req.params.id;
    const userName = req.session.name;
    console.log("product id is: " + id);
    const category = await categoryModel.find({});
    const productDetails = await productModel.findOne({ _id: id });
    console.log("product category is: " + productDetails);
    const categoryData = await productModel.find({
      $and: [
        { category: productDetails.category },
        { _id: { $ne: productDetails._id } },
      ],
    });
    console.log(
      "Specific category data except the product seen in page :\n" +
        categoryData
    );
    res.render("userProductPage", {
      category,
      productDetails,
      available: "In Stock",
      notAvailable: "Out of Stock",
      categoryData,
      user: userName,
      cartCount,
    });
  } catch (error) {
    console.log("Error while displaying product page " + error);
  }
};
const categoryPage = async (req, res) => {
  try {
    console.log("Guest category page");
    const category = await categoryModel.find({});
    console.log("This is category check :" + category);
    const catName = req.params.catName;
    const catProd = await productModel.find({ category: catName });
    // console.log("Category products is::::" +catProd);
    res.render("categoryPage", { category, catName, catProd });
  } catch (error) {
    console.log("Error while accessing guest category pages:" + error);
  }
};

const userCategoryPage = async (req, res) => {
  try {
    const cartProducts = await cartModel.find({ user: req.session.userID });
    const cartCount = cartProducts[0].item.length;
    console.log("cartCount is:", cartCount);

    console.log("User category page");
    const userName = req.session.name;
    const searchValue = "";
    const searchData = "";
    const category = await categoryModel.find({});
    //console.log("This is category check :" + category);
    const catName = req.params.catName;
    req.session.categoryName = catName;
    noProduct = "";

    const catProd = await productModel.find({ category: catName, hide: 0 });
    // console.log("Category products is::::" +catProd);
    res.render("userCategoryPage", {
      user: userName,
      category,
      catName,
      catProd,
      searchValue,
      searchData,
      noProduct,
      cartCount,
    });
    console.log("CATEGORY SELECTED IS::::" + catName);
    console.log(catProd);
    req.session.categoryName = catName;
  } catch (error) {
    console.log("Error while accessing user category pages:" + error);
  }
};

const search = async (req, res) => {
  try {
    var searchValue = req.body.searchValue;
    console.log("The searched data is: " + searchValue);
    const category = await categoryModel.find({});
    const searchData = await productModel.find({
      name: { $regex: new RegExp(searchValue, "i") },
    });
    console.log("searchData value is" + searchData);
    const noProduct = "No such product available";
    res.render("search", { category, searchData, searchValue, noProduct });
  } catch (error) {
    console.log("Error while searching a product by guest: " + error);
  }
};

const userCategorySearch = async (req, res) => {
  try {
    const cartProducts = await cartModel.find({ user: req.session.userID });
    const cartCount = cartProducts[0].item.length;

    var searchValue = req.body.searchValue;
    const catName = req.params.catName;
    const catProd = "";
    console.log("The searched data is: " + searchValue);
    console.log("Category is :" + catName);
    const searchData = await productModel.find({
      $and: [
        { category: catName },
        { name: { $regex: new RegExp(searchValue, "i") } },
      ],
    });
    console.log("categoryProducts is: ", searchData);
    console.log("length of categoryProducts is: ", searchData.length);

    const category = await categoryModel.find({});
    // const searchData = await productModel.find({
    //   name: { $regex: new RegExp(searchValue, "i") },
    // });
    // console.log("searchData value is" + searchData);
    const noProduct = "No such product available";
    res.render("userCategoryPage", {
      searchValue,
      catName,
      category,
      searchData,
      searchValue,
      noProduct,
      user: req.session.name,
      catProd,
      cartCount,
    });
  } catch (error) {
    console.log("Error while searching a product by guest: " + error);
  }
};

const browse = async (req, res) => {
  try {
    const cartProducts = await cartModel.find({ user: req.session.userID });
    const cartCount = cartProducts[0].item.length;
    const category = await categoryModel.find();
    console.log("***********");
    console.log(category);
    console.log("***********");

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 3;
    const products = await productModel
      .find({})
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const productCount = await productModel.find({}).countDocuments({});
    const totalPages = productCount / limit;
    console.log("PRODUCTS:" + products);
    //console.log(products);
    res.render("browseAll", {
      user: req.session.name,
      products,
      totalPages,
      cartCount,
      category,
    });
  } catch (error) {
    console.log("Error while browse", error);
  }
};

const searchInCategory = async (req, res) => {
  try {
    console.log("searchInCategory");
    console.log(req.params);
  } catch (error) {
    console.log("Error while searchInCategory :" + error);
  }
};

const shop = async (req, res) => {
  try {
    //const id = req.params.id;
    //const productDetails = await productModel.findOne({ _id: id });
    var searchValue = req.body.searchValue;
    const userName = req.session.name;
    console.log("The searched data is: " + searchValue);
    const category = await categoryModel.find({});
    const searchData = await productModel.find({
      name: { $regex: new RegExp(searchValue, "i") },
    });
    console.log("searchData value is" + searchData);
    const noProduct = "No such product available";
    res.render("shopUser", {
      category,
      searchData,
      searchValue,
      user: userName,
      noProduct,
    });
  } catch (error) {
    console.log("Error while searching a product by logged in user: " + error);
  }
};

const account = async (req, res) => {
  try {
    //console.log("req.session.name is: " + req.session.name);
    const user = await userModel.findOne({ username: req.session.name });
    console.log("USER IS:" + user);
    console.log(user.username);
    res.render("userAccount", { user });
    console.log("USER ACCOUNT");
  } catch (error) {
    console.log("Error while rendering user account page :" + error);
  }
};

const profile = async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.name });
    res.render("userProfile", { user });
    console.log("USER PROFILE");
  } catch (error) {
    console.log("Error while rendering user profile page :" + error);
  }
};

const editProfile = async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.name });
    res.render("userEditProfile", {
      user: req.session.name,
      user,
      data_exist: "",
      // data2_exist: "",
    });
    console.log("Edit User profile");
    console.log(user.mobile);
  } catch (error) {
    console.log("Error while updating user profile :" + error);
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.name });
    console.log("req.body.username :" + req.body.username);
    console.log("user.username  :" + user.username);
    console.log(
      "user.email  :" +
        user.email +
        "------------------------------------------->>>>"
    );
    req.session.sessionEmail = user.email;
    console.log(
      req.session.sessionEmail,
      +"-------------------------------------------<<<<"
    );
    if (req.body.username === user.username) {
      req.session.error1 = "New name & the current name should not be the same";
      res.redirect("/account/editProfile");
    } else if (req.body.mobile === user.mobile) {
      req.session.error1 = "You have entered same old number";
      res.redirect("/account/editProfile");
    } else {
      console.log(req.body.dob);
      await userModel.updateOne(
        { email: req.body.email },
        {
          $set: {
            username: req.body.username,
            mobile: req.body.mobile,
            dob: req.body.dob,
          },
        },
        { upsert: true }
      );
      req.session.isUser = false;
      req.session.logout = "Please relogin to access";
      res.redirect("/login");
    }
  } catch (error) {
    console.log("Error occurred in between updateUserProfile : " + error);
  }
};

const showEditProfile = async (req, res) => {
  try {
    const user = await userModel.findOne({ username: req.session.name });
    let data_exist = req.session.error1;
    //let data2_exist = req.session.error2;
    console.log("username_exist is" + data_exist);
    res.render("userEditProfile", {
      user: req.session.name,
      user,
      data_exist,
      // data2_exist,
    });
  } catch (error) {
    console.log("Error occurred during showEditProfile : " + error);
  }
};

const security = async (req, res) => {
  try {
    let oldPasswordError = req.session.oldPasswordError
      ? req.session.oldPasswordError
      : "";
    res.render("userSetNewPassword", { oldPasswordError });
    console.log("USER NOW ON CHANGE PASSWORD PAGE IN HIS ACCOUNT");
  } catch (error) {
    console.log("Error occurred while security : " + error);
  }
};

const setNewPassword = async (req, res) => {
  try {
    const name = req.session.name;
    const data = await userModel.findOne(
      { username: name },
      { _id: 0, password: 1 }
    );
    const result = await bcrypt.compare(req.body.oldPassword, data.password);
    console.log("RESULT IS" + result);

    if (!result) {
      req.session.oldPasswordError = "Old password entered is incorrect";
      res.redirect("/account/security");
    } else {
      let newPass = await bcrypt.hash(req.body.newPassword1, 10);
      console.log(newPass);
      await userModel.updateOne(
        { username: name },
        { $set: { password: newPass } }
      );
      req.session.passChange =
        "You changed the password. Please login to proceed";
      req.session.isUser = false;
      res.redirect("/login");
    }
  } catch (error) {
    console.log("Error occurred in between setNewPassword : " + error);
  }
};

// const address = (req, res) => {
//   try {
//     res.render("userAddress", { user: req.session.name });
//   } catch (error) {
//     console.log("Error when accessing address : " + error);
//   }
// };

// const newAddress = (req, res) => {
//   try {
//     res.render("userAddAddress");
//   } catch (error) {
//     console.log("Error when accessing newAddress : " + error);
//   }
// };

const logout = (req, res) => {
  try {
    //await req.session.destroy();
    req.session.isUser = false;
    req.session.logout = "You have logged out";
    res.redirect("/login");
    console.log("Bye User");
  } catch (error) {
    console.log("Error during user signout ", +error);
  }
};

const test = (req, res) => {
  id = req.params.id;
  console.log("TEST" + id);
};

module.exports = {
  test,
  updateUserProfile,
  userCategorySearch,
  showEditProfile,
  browse,
  indexPage,
  login,
  register,
  toVerifyOTP,
  authOTP,
  otp,
  forgotPassword,
  authEmail,
  validateUser,
  fpGetOTP,
  fpAuthOTP,
  toChangePassword,
  updatePassword,
  redirectUser,
  userProductView,
  productView,
  categoryPage,
  userCategoryPage,
  resendOTP,
  search,
  shop,
  logout,
  searchInCategory,
  account,
  profile,
  editProfile,
  security,
  setNewPassword,
};
