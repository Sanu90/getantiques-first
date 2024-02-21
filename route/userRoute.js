const router = require("express").Router();
const userController = require("../controller/userController");
// const productController = require("../controller/productController");
// const orderController = require("../controller/orderController");
const userCheck = require("../middleware/userAuth");

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
router.post("/home", userController.validateUser);
router.get("/product/:id", userController.productView);

router.get(
  "/Ucategory/:catName",
  userCheck.isUser,
  userController.userCategoryPage
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
