const router = require("express").Router();
//var session = require("express-session");

const adminMiddleware = require("../middleware/adminAuth");
const userController = require("../controller/userController");
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const orderController = require("../controller/orderController");
const couponController = require("../controller/couponController");
const multer = require("../middleware/multer");

router.get("/", adminController.adminLoginPage);
router.post("/dashboard", adminController.adminDashboard);
router.get("/dashboard", adminMiddleware.isAdmin, adminController.admintoDash);
router.get(
  "/sales_data",
  adminMiddleware.isAdmin,
  adminController.getSalesData
);
// router.get("/chart-data", adminMiddleware.isAdmin, adminController.chartData);
// router.get(
//   "/chart-data-month",
//   adminMiddleware.isAdmin,
//   adminController.chartDataMonth
// );
// router.get(
//   "/chart-data-year",
//   adminMiddleware.isAdmin,
//   adminController.chartDataYear
// );

// ** ** ** ** ** ** ** ** //
router.get(
  "/category",
  adminMiddleware.isAdmin,
  categoryController.adminCategory
);

router.get("/order", adminMiddleware.isAdmin, orderController.orderPage);
router.get("/check-order-returns", orderController.check_order_returns);

router.get("/orderDetails", orderController.adminOrderDetails);

router.post(
  "/category",
  adminMiddleware.isAdmin,
  categoryController.updateCategory
);

router.post(
  "/addCategory",
  adminMiddleware.isAdmin,
  categoryController.addCategory
);

router.post(
  "/categoryEdit/:name",
  adminMiddleware.isAdmin,
  categoryController.editCategory
);

router.post("/searchCat", adminMiddleware.isAdmin, adminController.searchCat);
router.post("/searchUser", adminMiddleware.isAdmin, adminController.searchUser);
router.post(
  "/searchProduct",
  adminMiddleware.isAdmin,
  adminController.searchProduct
);

// ** ** ** ** ** ** ** ** //

router.get("/user", adminMiddleware.isAdmin, adminController.adminShowUsers);

router.post("/userHide", adminMiddleware.isAdmin, adminController.userHide);

// ** ** ** ** ** ** ** ** //

router.get("/product", adminMiddleware.isAdmin, productController.adminProduct);

router.post(
  "/product",
  adminMiddleware.isAdmin,
  multer.array("images", 5),
  productController.addProduct
);

router.post(
  "/productEdit/:name",
  adminMiddleware.isAdmin,
  productController.editProduct
);

router.get(
  "/addProduct",
  adminMiddleware.isAdmin,
  productController.newProductPage
);

router.post(
  "/productUpdate",
  adminMiddleware.isAdmin,
  // multer.array("newImages", 5),
  multer.fields([
    { name: "0Image", maxCount: 1 },
    { name: "1Image", maxCount: 1 },
    { name: "2Image", maxCount: 1 },
    { name: "3Image", maxCount: 1 },
  ]),
  productController.updateProduct
);

router.post(
  "/addProductImages/:id",
  adminMiddleware.isAdmin,
  multer.array("newImages", 5),
  productController.addProductImages
);

router.post(
  "/productHide",
  adminMiddleware.isAdmin,
  productController.productHide
);

router.get("/coupon", adminMiddleware.isAdmin, couponController.coupon);
router.post("/addCoupon", adminMiddleware.isAdmin, couponController.addCoupon);
router.post(
  "/couponEdit/:id",
  adminMiddleware.isAdmin,
  couponController.couponEdit
);
router.post(
  "/edit-coupon-save",
  adminMiddleware.isAdmin,
  couponController.saveEditCoupon
);

router.post(
  "/removeCoupon",
  adminMiddleware.isAdmin,
  couponController.deleteCoupon
);

router.post("/approveReturnByAdmin", adminController.approveReturnByAdmin);

router.post(
  "/salesReport",
  // adminMiddleware.isAdmin,
  adminController.salesReport
);

router.post(
  "/updateOrderStatus",
  adminMiddleware.isAdmin,
  adminController.updateOrderStatus
);

router.get("/signout", adminController.adminSignout);

module.exports = router;
