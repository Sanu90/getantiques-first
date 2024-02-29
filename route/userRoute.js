const router = require("express").Router();
const userController = require("../controller/userController");
const addressController = require("../controller/addressController");
// const productController = require("../controller/productController");
const orderController = require("../controller/orderController");
const userCheck = require("../middleware/userAuth");
const cartController = require("../controller/cartController");

router.get("/", userController.indexPage);
router.get("/login", userController.login);
router.get("/register", userController.register);
router.post("/otp", userController.toVerifyOTP);
router.get("/otp", userController.otp);
router.post("/verifyOTP", userController.authOTP);
router.get("/forgotPassword", userController.forgotPassword);
router.post("/authEmail", userController.authEmail);
router.get("/forgotPassword/getOTP", userController.fpGetOTP);
router.post("/forgotPassword/authOTP", userController.fpAuthOTP);
router.get("/changePassword", userController.toChangePassword);
router.post("/updatePassword", userController.updatePassword);
router.get("/home", userCheck.isUser, userController.redirectUser);
router.post("/shop", userCheck.isUser, userController.shop);
router.get("/browse", userCheck.isUser, userController.browse);
router.get("/account", userCheck.isUser, userController.account);
router.get("/account/profile", userCheck.isUser, userController.profile);
router
  .post("/account/editProfile", userCheck.isUser, userController.editProfile)
  .get(
    "/account/editProfile",
    userCheck.isUser,
    userController.showEditProfile
  );
router.post(
  "/account/editProfile_Success",
  userCheck.isUser,
  userController.updateUserProfile
);

router.get("/account/security", userCheck.isUser, userController.security);

router.post(
  "/account/setNewPassword",
  userCheck.isUser,
  userController.setNewPassword
);

router.get("/account/address", userCheck.isUser, addressController.address);
router.get(
  "/account/newAddress",
  userCheck.isUser,
  addressController.newAddress
);
router.post(
  "/account/saveAddress",
  userCheck.isUser,
  addressController.saveAddress
);

router.get("/cart/:id", userCheck.isUser, cartController.cart);

router.get(
  "/account/editAddress/:id",

  addressController.editAddress
);

router.post(
  "/account/updateAddress",
  userCheck.isUser,
  addressController.updateAddress
);

router.get(
  "/account/deleteAddress/:id",
  userCheck.isUser,
  addressController.deleteAddress
);

router.get("/account/order", userCheck.isUser, orderController.userOrder);

router.post("/home", userController.validateUser);
router.get("/product/:id", userController.productView);

router.get(
  "/Ucategory/:catName",
  userCheck.isUser,
  userController.userCategoryPage
);

router.post(
  "/Ucategory/:catName",
  userCheck.isUser,
  userController.userCategorySearch
);

// router.get("/allProducts", userController.allProducts); //
router.get("/category/:catName", userController.categoryPage);

router.get(
  "/productPage/:id",
  userCheck.isUser,
  userController.userProductView
);
router.get("/resendOTP", userController.resendOTP);

router.post("/search", userController.search);

router.get("/logout", userController.logout);

module.exports = router;
