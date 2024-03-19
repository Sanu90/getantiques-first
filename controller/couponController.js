const couponModel = require("../model/couponModel");
const userModel = require("../model/userModel");

const coupon = async (req, res) => {
  try {
    console.log("COUPON ADMIN PAGE");
    console.log(req.query.msg);
    if (!req.query.msg) {
      couponError = "";
    } else {
      couponError = req.query.msg;
    }
    const couponData = await couponModel.find({}).sort({ _id: -1 });
    console.log("couponData is: ", couponData);
    res.render("admin_coupons", {
      name: req.session.adminName,
      couponData,
      couponError,
    });
  } catch (error) {
    console.log("Error occurred while coupon in couponController");
  }
};

const addCoupon = async (req, res) => {
  try {
    console.log("Admin adding coupon--->");
    console.log("Entered values by Admin: ", req.body);
    console.log(req.body.discount);
    console.log(typeof req.body.discount);
    console.log(req.body.minCartValue);
    console.log(req.body.expiry);

    // ************************** //
    // const date = new Date();
    // let day = date.getDate();
    // let month = date.getMonth() + 1;
    // let year = date.getFullYear();
    // let date1 = `${day}-${month}-${year}`;
    // console.log("DATE IS:", date1);
    // let currentDate = new Date().toJSON().slice(0, 10);
    //console.log("currentDate is: ", currentDate);
    // *************************** //

    const couponFound = await couponModel.find({
      name: req.body.couponName,
    });
    console.log("Is there already this coupon available? ", couponFound);
    console.log(couponFound.length);
    if (couponFound.length == 1) {
      res.redirect("/admin/coupon?msg= Coupon already available");
    }
    if (couponFound.length === 0) {
      console.log("aaaaaaaaaa");
      if (Number(req.body.minCartValue) > Number(req.body.discount)) {
        console.log("bbbbbbbbbbbb");
        const newCoupon = new couponModel({
          name: req.body.couponName,
          // expiry: new Date(req.body.expiry),
          expiry: req.body.expiry,
          discount: req.body.discount,
          minimum_cart_value: req.body.minCartValue,
        });
        await newCoupon.save();
        res.redirect("/admin/coupon?msg=Coupon added");
      } else if (Number(req.body.minCartValue) < Number(req.body.discount)) {
        console.log("ccccccccccc");
        res.redirect("/admin/coupon?msg= Discount should be smaller value");
      }
    }
  } catch (error) {
    console.log("Error occurred while addCoupon in couponController");
  }
};

const couponEdit = async (req, res) => {
  try {
    console.log("ADMIN: Coupon EDit page");
    const couponID = req.params.id;
    console.log(couponID);
    req.session.couponID = couponID;
    const couponData = await couponModel.findOne({ _id: couponID });
    console.log("Details of the couponID:", couponData);
    res.render("admin_coupon_edit", {
      name: req.session.adminName,
      couponData,
    });
  } catch (error) {
    console.log("error happened between couponEdit in couponController");
  }
};

const saveEditCoupon = async (req, res) => {
  try {
    console.log("Saving Edited Coupon");
    console.log(req.session.couponID);
    await couponModel.updateOne(
      { _id: req.session.couponID },
      {
        $set: {
          name: req.body.newCouponName,
          expiry: req.body.newExpiry,
          discount: req.body.newDiscount,
          minimum_cart_value: req.body.newMinCartValue,
        },
      }
    );
    console.log("COUPON UPDATED");
    res.redirect("/admin/coupon?msg= Coupon updated");
  } catch (error) {
    console.log(
      "Error happened between saveEditCoupon in couponcontroller",
      error
    );
  }
};

const deleteCoupon = async (req, res) => {
  try {
    console.log("DELETING COUPON");
    const couponID = req.body.couponId;
    console.log(couponID);
    await couponModel.deleteOne({ _id: couponID });
    console.log("COUPON DELETED BY ADMIN");
    res.status(200).json({ success: true, message: "Coupon deleted" });
    // console.log(req.body);
    // res.json({
    //   name: "abc",
    // });
  } catch (error) {
    console.log("Error while deleteCoupon in couponController", error);
  }
};

module.exports = {
  coupon,
  addCoupon,
  couponEdit,
  saveEditCoupon,
  deleteCoupon,
};
