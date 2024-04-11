const categoryModel = require("../model/categoryModel");

const adminCategory = async (req, res) => {
  try {
    const categoryCount = await categoryModel.find({}).count();
    console.log(categoryCount);
    const limit = 5;
    var category = await categoryModel
      .find({})
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ _id: -1 }); //cant use const here as it will render error when a category is searched//

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const totalPages = Math.ceil(categoryCount / limit);

    if (req.session.data) {
      category = req.session.data;
      value = req.session.search;
    }
    console.log(category);
    catAvailable = "";
    let a = req.session.catAvailable;
    res.render("admin_categories", {
      name: req.session.adminName,
      category,
      catAvailable: catAvailable ? catAvailable : a,
      totalPages,
      currentPage: page,
    });
    console.log("ADMIN: CATEGORY");
  } catch (err) {
    console.log(err);
    res.send("Error Occurred");
  }
};

const addCategory = async (req, res) => {
  try {
    console.log("()()()()()");
    let catSearch = await categoryModel.find({ name: req.body.catName });
    console.log("catSearch is:" + catSearch);
    if (catSearch.length >= 1) {
      req.session.catAvailable = "Category already available";
      res.redirect("/admin/category");
    } else {
      console.log("Not avail");
      const newCat = new categoryModel({
        name: req.body.catName,
        description: req.body.catDesc,
        hide: 0,
      });
      await newCat.save();
      console.log("category added");
      res.redirect("/admin/category");
    }
  } catch (err) {
    console.log(err.message);
    res.redirect("/admin/error?message=error-while-adding-category");
  }
};

const editCategory = async (req, res) => {
  try {
    catName = req.params.name;
    console.log("Admin is updating category, ", catName);
    const categoryDetails = await categoryModel.find({ name: catName });
    console.log("Respective category details: ", categoryDetails);
    const oldName = req.body.oldCategory;
    const oldDesc = req.body.oldDescription;
    const offer = categoryDetails[0].offer;
    console.log(req.body);
    console.log(oldName);
    console.log(oldDesc);
    console.log("ADMIN: CATEGORY EDIT");
    res.render("admin_categories_edit", {
      name: req.session.adminName,
      oldName,
      oldDesc,
      offer,
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
      {
        $set: {
          name: req.body.newCatname,
          description: req.body.newCatDesc,
          offer: req.body.offer,
        },
      }
    );
    console.log("CATEGORY UPDATED");
    return res.redirect("/admin/category");
  } catch (err) {
    console.log(err.message);
    res.redirect("/admin/error?message=error-while-updating-category");
  }
};

module.exports = { adminCategory, addCategory, editCategory, updateCategory };
