const categoryModel = require("../model/categoryModel");

const adminCategory = async (req, res) => {
  try {
    var category = await categoryModel.find({}).sort({ _id: -1 }); //cant use const here as it will render error when a category is searched//
    if (req.session.data) {
      category = req.session.data;
      value = req.session.search;
    }
    console.log(category);
    res.render("admin_categories", { name: req.session.name, category });
    console.log("ADMIN: CATEGORY");
  } catch (err) {
    console.log(err);
    res.send("Error Occurred");
  }
};

const addCategory = async (req, res) => {
  try {
    const newCat = new categoryModel({
      name: req.body.catName,
      description: req.body.catDesc,
      hide: 0,
    });
    await newCat.save();
    console.log("category added");
    res.redirect("/admin/category");
  } catch (err) {
    console.log(err.message);
    res.redirect("/admin/error?message=error-while-adding-category");
  }
};

const editCategory = async (req, res) => {
  try {
    const oldName = req.body.oldCategory;
    const oldDesc = req.body.oldDescription;
    console.log(req.body);
    console.log(oldName);
    console.log(oldDesc);
    console.log("ADMIN: CATEGORY EDIT");
    res.render("admin_categories_edit", {
      name: req.session.name,
      oldName,
      oldDesc,
    });
  } catch (err) {
    console.log(err.message);
    res.redirect("/error?message=error-while-updating-category");
  }
};

const updateCategory = async (req, res) => {
  try {
    console.log(req.body);
    await categoryModel.updateOne(
      { name: req.body.oldCatName },
      { $set: { name: req.body.newCatname, description: req.body.newCatDesc } }
    );
    console.log("CATEGORY UPDATED");
    return res.redirect("/admin/category");
  } catch (err) {
    console.log(err.message);
    res.redirect("/admin/error?message=error-while-updating-category");
  }
};

module.exports = { adminCategory, addCategory, editCategory, updateCategory };
