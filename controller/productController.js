const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const cartModel = require("../model/cartModel");
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
      name: req.session.adminName,
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
    res.render("admin_add_product", { name: req.session.adminName, category });
    console.log("ADMIN WILL ADD PRODUCT");
  } catch (err) {
    console.log("Error while redirecting the page to add product: " + err);
  }
};

var imagePath = [];
const addProduct = async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files);
    const imageData = req.files;
    for (let i = 0; i < imageData.length; i++) {
      imagePath[i] = imageData[i].path
        .replace(/\\/g, "/")
        .replace("public", "");
    }
    //console.log("IMAGEPATH is: ", imagePath);
    req.imagePath = imagePath;
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
    //productImages = await productModel.find({})
    //console.log("Product Images: ");
    console.log("product added");
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
    const allOldData = await productModel.findOne({ name: oldName });
    console.log("::allOldData::-------------------->..." + allOldData);
    totalImages = allOldData.image.length;
    //console.log("length of image folder:------->" + allOldData.image.length);
    //console.log(allOldData.image.countDocuments({}));
    console.log("ADMIN: PRODUCT EDIT");
    console.log("********************");
    console.log(req.body);
    console.log("11111111111");
    console.log(oldCategory);
    console.log("********************");
    imagePath = allOldData.image;
    console.log("IMAGEPATH is: ", imagePath);
    console.log("********************");
    res.render("admin_product_edit", {
      name: req.session.adminName,
      oldName,
      oldCategory,
      oldRate,
      oldStock,
      oldDesc,
      category,
      allOldData,
      totalImages,
    });
  } catch (err) {
    console.log(err.message);
    return res.redirect("/error?message=error-while-updating-category");
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log("ADMIN UPDATED PRODUCT");
    console.log("req.body is", req.body);
    console.log("********************");
    console.log("req.file", req.files);
    console.log("********************");
    for (let i in req.files) {
      console.log(parseInt(`${i}`));
      let index = parseInt(`${i}`);
      console.log("###############################");
      let newImagePath = req.files[i][0].path
        .replace(/\\/g, "/")
        .replace("public", "");
      console.log(newImagePath);
      await productModel.updateOne(
        { name: req.body.oldProdName },
        {
          $set: { [`image.${index}`]: newImagePath },
        }
      );
    }
    console.log("************************");
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
    console.log("IMAGEPATH is: ", imagePath);
    console.log("PRODUCT UPDATED");
    return res.redirect("/admin/product");
  } catch (err) {
    console.log(err.message);
    return res.redirect("/admin/error?message=error-while-updating-category");
  }
};

const addProductImages = async (req, res) => {
  //console.log("::allOldData::-------------------->..." + allOldData);
  //totalImages = allOldData.image.length;
  console.log(req.files);
  id = req.params.id;
  productFind = await productModel.findOne({ _id: id });
  console.log("Product ID is:" + id);
  const newImagesData = req.files;
  console.log("newImagesData", newImagesData);
  console.log(newImagesData.length);
  newLength = newImagesData.length;
  productImages = productFind.image;
  let savePath = [];
  for (let i = 0; i < newLength; i++) {
    savePath[i] = newImagesData[i].path
      .replace(/\\/g, "/")
      .replace("public", "");
  }
  console.log("New Images path is: ", savePath);
  console.log("Length of new images:" + newLength);

  const newImages = await productModel.updateOne(
    { _id: id },
    { $push: { image: { $each: savePath, $position: 0 } } }
  );
  console.log("newImages: ", newImages);
  const data = { key: "details updated" };
  // return res.redirect("/admin/product");
  return res.redirect(`/admin/product?data=${JSON.stringify(data)}`);
  //res.redirect("/admin/productEdit");

  //await newImages.save();

  // //console.log("imagePath ", imagePath);
  // console.log("******************************");
  // console.log("New images added to DB.");
};

const productHide = async (req, res) => {
  try {
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

const categoryProductSort = async (req, res) => {
  try {
    const cartProducts = await cartModel.find({ user: req.session.userID });
    const cartCount = cartProducts[0].item.length;

    const catName = req.session.categoryName;
    const userName = req.session.name;
    const searchValue = "";
    const searchData = "";
    const category = await categoryModel.find({});
    const number = req.params.number;
    //console.log(number);
    if (number == 1) {
      const catProd = await productModel
        .find({ category: catName })
        .sort({ name: 1 });
      console.log("DATA IF 1 is pressed:" + catProd);
      const value = "A - Z";
      res.render("userCategoryPageSorted", {
        user: userName,
        category,
        catName,
        catProd,
        value,
        cartCount,
        // searchValue,
        // searchData,
      });
    } else if (number == 2) {
      const catProd = await productModel
        .find({ category: catName })
        .sort({ name: -1 });
      console.log("DATA IF 2 is pressed:" + catProd);
      res.render("userCategoryPageSorted", {
        user: userName,
        category,
        catName,
        catProd,
        searchValue,
        searchData,
        cartCount,
      });
    } else if (number == 3) {
      const catProd = await productModel
        .find({ category: catName })
        .sort({ rate: 1 });
      console.log("DATA IF 3 is pressed:" + catProd);
      res.render("userCategoryPageSorted", {
        user: userName,
        category,
        catName,
        catProd,
        searchValue,
        searchData,
        cartCount,
      });
    } else if (number == 4) {
      const catProd = await productModel
        .find({ category: catName })
        .sort({ rate: -1 });
      console.log("DATA IF 4 is pressed:" + catProd);
      res.render("userCategoryPageSorted", {
        user: userName,
        category,
        catName,
        catProd,
        searchValue,
        searchData,
        cartCount,
      });
    }
  } catch (error) {
    console.log("Error happened while accessing categoryProductSort: " + error);
  }
};

module.exports = {
  adminProduct,
  newProductPage,
  addProduct,
  editProduct,
  updateProduct,
  productHide,
  categoryProductSort,
  addProductImages,
};
