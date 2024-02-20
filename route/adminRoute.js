const router = require("express").Router();
//var session = require("express-session");

const adminMiddleware = require("../middleware/adminAuth");
const userController = require("../controller/userController");
const adminController = require("../controller/adminController");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const orderController = require("../controller/orderController");
const multer = require("../middleware/multer");

router.get("/", adminController.adminLoginPage);
router.post("/dashboard", adminController.adminDashboard);
router.get("/dashboard", adminMiddleware.isAdmin, adminController.admintoDash);

// ** ** ** ** ** ** ** ** //
router.get(
  "/category",
  adminMiddleware.isAdmin,
  categoryController.adminCategory
);

router.get("/order", adminMiddleware.isAdmin, orderController.orderPage);

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
  multer.array("images", 10),
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
  productController.updateProduct
);

router.post(
  "/productHide",
  adminMiddleware.isAdmin,
  productController.productHide
);

router.get("/signout", adminController.adminSignout);

module.exports = router;
