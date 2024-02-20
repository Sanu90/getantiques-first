const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const multer = require("multer");
//const { name } = require("ejs");
//const multer = require("../middleware/multer");

const adminProduct = async (req, res) => {
  try {
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 3;
    var product = await productModel
      .find({})
      .sort({ _id: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit); //cant use const here as it will render error when a product is searched//

    const count = await productModel.find({}).countDocuments(); // counts the total products //
    console.log("PRODUCT COUNT IS :" + count);

    if (req.session.prodData) {
      product = req.session.prodData;
    }
    console.log("product list:" + product);
    console.log("ADMIN: PRODUCTS");
    res.render("admin_products", {
      name: req.session.name,
      product,
      totalPages: Math.floor(count / limit),
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.send("Error Occurred");
  }
};

const newProductPage = async (req, res) => {
  const category = await categoryModel.find({}).sort({ name: 1 });
  try {
    console.log("category details: " + category);
    res.render("admin_add_product", { name: req.session.name, category });
    console.log("ADMIN WILL ADD PRODUCT");
  } catch (err) {
    console.log("Error while redirecting the page to add product: " + err);
  }
};

const addProduct = async (req, res) => {
  try {
    //res.send("product added");
    console.log(req.body);
    console.log(req.files);
    const imageData = req.files;
    let imagePath = [];
    for (let i = 0; i < imageData.length; i++) {
      imagePath[i] = imageData[i].path
        .replace(/\\/g, "/")
        .replace("public", "");
    }
    console.log(imagePath);
    const newProd = new productModel({
      name: req.body.prodName,
      category: req.body.category,
      rate: req.body.prodRate,
      description: req.body.prodDesc,
      stock: req.body.quantity,
      image: imagePath,
      hide: 0,
    });
    await newProd.save();
    //   console.log("product added");
    //   console.log(req.body.images);
    //   console.log(req.file.filename);
    return res.redirect(`/admin/product`);
  } catch (err) {
    console.log("error while adding product to the DB: " + err);
    // return res.redirect(`/admin/error`);
  }
};

const editProduct = async (req, res) => {
  try {
    const category = await categoryModel.find({}).sort({ name: 1 });
    const oldName = req.body.oldName;
    const oldCategory = req.body.oldCategory;
    const oldRate = req.body.oldRate;
    const oldStock = req.body.oldStock;
    const oldDesc = req.body.oldDesc;
    //const oldDesc = req.body.oldDescription;
    console.log(req.body);
    console.log(oldName);
    console.log(oldCategory);
    console.log("ADMIN: PRODUCT EDIT");
    res.render("admin_product_edit", {
      name: req.session.name,
      oldName,
      oldCategory,
      oldRate,
      oldStock,
      oldDesc,
      category,
    });
  } catch (err) {
    console.log(err.message);
    return res.redirect("/error?message=error-while-updating-category");
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log(req.body);
    await productModel.updateOne(
      { name: req.body.oldProdName },
      {
        $set: {
          name: req.body.newProdName,
          category: req.body.newProdCat,
          rate: req.body.newProdRate,
          description: req.body.newProdDesc,
          stock: req.body.newProStock,
        },
      }
    );
    console.log("PRODUCT UPDATED");
    return res.redirect("/admin/product");
  } catch (err) {
    console.log(err.message);
    return res.redirect("/admin/error?message=error-while-updating-category");
  }
};

const productHide = async (req, res) => {
  try {
    //console.log("jchf");
    console.log(req.body.id);
    const data = await productModel.findOne({ _id: req.body.id });
    if (data.hide == 0) {
      await productModel.updateOne({ _id: req.body.id }, { $set: { hide: 1 } });
    } else {
      await productModel.updateOne({ _id: req.body.id }, { $set: { hide: 0 } });
    }
    res.json({ success: true });
    console.log(data);
  } catch (error) {
    console.log("Error while hiding product: " + error);
  }
};

module.exports = {
  adminProduct,
  newProductPage,
  addProduct,
  editProduct,
  updateProduct,
  productHide,
};
