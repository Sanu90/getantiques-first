const userModel = require("../model/userModel");
const cartModel = require("../model/cartModel");
const wishlistModel = require("../model/wishlistModel");
const productModel = require("../model/productModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const wishlist = async (req, res) => {
  try {
    const user = req.session.name;
    const userID = req.session.userID;

    // cart count //
    const cartProducts = await cartModel.find({ user: req.session.userID });
    cartCount = 0;
    if (cartProducts == "") {
      cartCount = 0;
    } else {
      cartCount = cartProducts[0].item.length;
      console.log("cartCount is:", cartCount);
    }
    // end //

    // wishlist count //
    const total_Products_Wishlist = await wishlistModel.findOne({
      userID: userID,
    });
    console.log("total_Products_Wishlist", total_Products_Wishlist);
    if (total_Products_Wishlist == null) {
      wishlistCount = 0;
    } else {
      wishlistCount = total_Products_Wishlist.products.length;
    }
    console.log("wishlistCount ", wishlistCount);
    // end //

    let products = [];
    if (total_Products_Wishlist) {
      const productIDs = total_Products_Wishlist.products.map(
        (product) => product.id
      );

      products = await productModel.aggregate([
        { $match: { _id: { $in: productIDs } } },
        { $project: { name: 1, rate_after_discount: 1, image: 1 } },
      ]);

      console.log("Product wishlist data is: ", products);
    }

    res.render("wishlist", {
      cartCount,
      user,
      wishlistCount,
      products,
    });
    console.log("Wishlist is rendered for user.");
  } catch (error) {
    console.log(
      "Error occurred while accessing wishlist in cartController",
      error
    );
  }
};

const addtoWishlist = async (req, res) => {
  try {
    const userID = req.session.userID;
    productID = req.params.id;
    console.log("product id is:", productID);
    console.log("user ID is:", userID);

    // Check if the product already exists in the user's wishlist
    const existingWishList = await wishlistModel.find({
      userID: userID,
      "products.id": productID,
    });
    console.log("User Wishlist values:", existingWishList);
    if (existingWishList.length === 0) {
      await wishlistModel.updateOne(
        { userID: userID },
        { $push: { products: { id: productID } } },
        { upsert: true }
      );
    }
    const total_Products_Wishlist = await wishlistModel.findOne({
      userID: userID,
    });
    console.log("total_Products_Wishlist", total_Products_Wishlist);
    console.log(
      "total_Wishlist_Count is:",
      total_Products_Wishlist.products.length
    );
    res
      .status(200)
      .json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    console.log("Error happened in addtoWishlist in wishlistController");
  }
};

const clearWishlist = async (req, res) => {
  try {
    console.log("Clearing wishlist...user...............");
    productId = req.body.productId;
    console.log(productId);
    const userID = req.session.userID;

    const result = await wishlistModel.updateOne(
      { userID: new ObjectId(userID) },
      { $pull: { products: { id: new ObjectId(productId) } } }
    );

    console.log("WISHLIST REMOVED RESULT IS:", result);
    res
      .status(200)
      .json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.log(
      "Error happened between clearWishlist in wishlistConroller",
      error
    );
  }
};

module.exports = { wishlist, addtoWishlist, clearWishlist };
