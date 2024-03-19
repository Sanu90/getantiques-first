const router = require("express").Router();
const userController = require("../controller/userController");
const addressController = require("../controller/addressController");
const productController = require("../controller/productController");
const orderController = require("../controller/orderController");
const userCheck = require("../middleware/userAuth");
const cartController = require("../controller/cartController");
const wishlistController = require("../controller/wishlistController");

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
router.get("/home", userController.redirectUser);
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

router.post(
  "/saveNewAddressfromCheckout",
  userCheck.isUser,
  addressController.saveNewAddressfromCheckout
);

router.get("/cart/:id", userCheck.isUser, cartController.addToCart);

router.get(
  "/account/editAddress/:id",
  userCheck.isUser,
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

router
  .get("/account/order", userCheck.isUser, orderController.userOrder)
  .post(
    "/account/order/:id",
    userCheck.isUser,
    orderController.userEachOrderData
  );


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

router.get(
  "/Ucategory/sort/:number",
  userCheck.isUser,
  productController.categoryProductSort
);
router.get("/cart", userCheck.isUser, cartController.cartPage);
router.post("/removeCart", userCheck.isUser, cartController.removeCart);
router.post("/minusCartvalue", userCheck.isUser, cartController.minusCartvalue);
router.post("/addCartvalue", userCheck.isUser, cartController.addCartvalue);

router.get("/wishlist", userCheck.isUser, wishlistController.wishlist);
router.get(
  "/addtoWishlist/:id",
  userCheck.isUser,
  wishlistController.addtoWishlist
);
router.post(
  "/clearWishlist",
  userCheck.isUser,
  wishlistController.clearWishlist
);

router.get("/checkout", userCheck.isUser, cartController.checkout);

router.post("/orderProduct", userCheck.isUser, orderController.orderProduct);

router.get(
  "/showAddressInCheckout",
  userCheck.isUser,
  addressController.showAddressInCheckout
);

router.get("/resendOTP", userController.resendOTP);

router.post("/search", userController.search);

router.get("/logout", userController.logout);

router.get("/test", userController.test);

module.exports = router;
