const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const cartModel = require("../model/cartModel");
const addressModel = require("../model/userAddressModel");
const walletModel = require("../model/walletModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// const addToCart = async (req, res) => {
//   try {
//     console.log("------------------------");
//     console.log("USER CLICKED ADD TO CART");
//     console.log("------------------------");
//     const product_id = req.params.id;
//     const category = await categoryModel.find({});
//     const product = await productModel.findOne({ _id: product_id });
//     console.log("Product details: " + product);
//     console.log("PRODUCT NAME, IMAGES & RATE is: ");
//     console.log(product.name, product.image[0], product.rate);
//     let cart_exist = await cartModel.findOne({ user: req.session.userID });
//     console.log("cart_exist is", cart_exist);
//     if (!cart_exist) {
//       let cart = new cartModel({
//         user: req.session.userID,
//         item: [],
//       });
//       const arrayValues = {
//         product: product_id,
//         product_quantity: 1,
//       };
//       cart.item.push(arrayValues);
//       await cart.save();
//       console.log(cart.item.length);
//     } else {
//       let existingCart = await cartModel.findOne({ user: req.session.userID });
//       console.log("existingCart is", existingCart);
//       const arrayValues = {
//         product: product_id,
//         product_quantity: 1,
//       };
//       existingCart.item.push(arrayValues);
//       await existingCart.save();
//       console.log(existingCart.item.length);
//     }
//     const cartProducts = await cartModel.find({ user: req.session.userID });
//     //console.log("cartProducts is:", cartProducts);
//     const cartCount = cartProducts[0].item.length;
//     console.log(cartCount);
//     console.log("Product added to cart");
//     res.redirect("/home");
//     //console.log(cart.item);
//   } catch (error) {
//     console.log("Error while addToCart");
//   }
// };

const addToCart = async (req, res) => {
  try {
    console.log("USER CLICKED ADD TO CART");
    const product_id = req.params.id;
    const userID = req.session.userID;

    // Check if the product already exists in the user's cart
    const existingCartItem = await cartModel.findOne({
      user: userID,
      "item.product": product_id,
    });

    const productDetails = await productModel.findOne({ _id: product_id });
    console.log(
      productDetails,
      "-----------------------------------------------------------------"
    );

    console.log("Existing cart item: ", existingCartItem);

    if (!existingCartItem) {
      // If the product doesn't exist, add it to the cart
      await cartModel.updateOne(
        { user: userID },
        {
          $push: {
            item: {
              product: product_id,
              product_quantity: 1,
              product_name: productDetails.name,
              product_rate: productDetails.rate_after_discount,
              product_rate_before_discount: productDetails.rate,
            },
          },
        },
        { upsert: true }
      );
    } else {
      // If the product exists, increment its quantity
      await cartModel.updateOne(
        { user: userID, "item.product": product_id },
        { $inc: { "item.$.product_quantity": 1 } }
      );
    }
    res.status(200).json({ success: true, message: "Product added to cart" });
    // Redirect back to home page or any other desired page
    //res.redirect("/home");
  } catch (error) {
    console.log("Error while addToCart:", error);
    res.status(500).send("Internal Server Error");
  }
};

const cartPage = async (req, res) => {
  try {
    console.log("CART PAGE");
    const userName = req.session.name;
    const category = await categoryModel.find({});
    const userID = req.session.userID;
    const cartData = await cartModel.find({ user: userID });
    console.log("userID", userID);
    console.log(new ObjectId(userID));
    console.log("cartData is:", cartData);
    //console.log(userID);
    console.log("***************");
    if (cartData.length > 0) {
      console.log(cartData[0].item);
    } else {
      console.log("Cart is empty");
    }
    console.log("***************");

    const cartProducts = await cartModel.aggregate([
      {
        $match: { user: new ObjectId(userID) },
      },
      {
        $unwind: "$item",
      },
      {
        $lookup: {
          from: "products",
          localField: "item.product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          _id: 0,
          productId: { $arrayElemAt: ["$product._id", 0] },
          productName: { $arrayElemAt: ["$product.name", 0] },
          productImage: { $arrayElemAt: ["$product.image", 0] },
          productPrice: { $arrayElemAt: ["$product.rate_after_discount", 0] },
          productQuantity: "$item.product_quantity",
        },
      },
    ]);

    console.log("cart products is: ", cartProducts);
    console.log("cart product length is", cartProducts.length);
    const cartCount = cartProducts.length;
    console.log("**************************");
    let total = 0;
    for (let i = 0; i < cartCount; i++) {
      console.log("*******####$@#@#!#@#!#!@#!$$***********");
      console.log("product quantity:", cartProducts[i].productQuantity);
      total =
        total + cartProducts[i].productPrice * cartProducts[i].productQuantity;
    }

    console.log("Total amount is:", total);
    req.session.cartTotal = total;
    console.log("req.session.cartTotal is: ", req.session.cartTotal);
    console.log("**************************");

    res.render("cart", {
      user: userName,
      category,
      cartProducts,
      cartCount,
      total,
    });

    console.log("cart page shown");
  } catch (error) {
    console.log("Error while cartPage in cartController", error);
  }
};

const removeCart = async (req, res) => {
  try {
    console.log("Remove cart.... user clearing cart values");
    productId = req.body.productId;
    console.log(productId);
    const userID = req.session.userID;
    const cartData = await cartModel.find({ user: userID });
    console.log("cartData", cartData);
    console.log(new ObjectId(userID));
    const result = await cartModel.updateOne(
      { user: new ObjectId(userID) },
      { $pull: { item: { product: new ObjectId(productId) } } }
    );
    console.log("CART REMOVED RESULT IS: ", result);
    res
      .status(200)
      .json({ success: true, message: "Product removed from cart" });

    // console.log("product details of this user", cartData[0].item);
  } catch (error) {
    console.log("Error while removeCart");
  }
};

// const minusCartvalue = async (req, res) => {
//   try {
//     console.log("Cart value reducing by user");
//     const userID = req.session.userID;
//     const product_id = req.body.productId;
//     console.log("User reduced the count of the product id: ", product_id);
//     await cartModel.updateOne(
//       { user: userID, "item.product": product_id },
//       { $inc: { "item.$.product_quantity": -1 } }
//     );
//     let aggregation_totalPrice = await cartModel.aggregate([
//       {
//         $match: { user: new ObjectId(userID) },
//       },
//       {
//         $unwind: "$item",
//       },
//       {
//         $match: { "item.product": new ObjectId(product_id) }, // Match the product ID
//       },
//       {
//         $lookup: {
//           from: "products", // Collection name of products
//           localField: "item.product",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           productCount: "$item.product_quantity",
//           productPrice: { $arrayElemAt: ["$product.rate_after_discount", 0] },
//         },
//       },
//       // {
//       //   $addFields: {
//       //     totalPrice: { $multiply: ["$productCount", "$productPrice"] }, // Calculate total price
//       //   },
//       // },
//     ]);

//     console.log(
//       "AGGREGATION RESULT FOR GETTING TOTAL PRICE:",
//       aggregation_totalPrice
//     );
//     productTotalValue = aggregation_totalPrice[0].totalPrice;
//     productCount = aggregation_totalPrice[0].productCount;
//     console.log("total price of the product is: ", productTotalValue);

//     // const totalCartValue = await cartDetails.aggregate([
//     //     {$match: {user: new ObjectId(userID) }}

//     // ])

//     res.header("Content-Type", "application/json").json({
//       productTotalValue: productTotalValue,
//       productCount: productCount,
//     });
//   } catch (error) {
//     console.log("error occurred while minusCartvalue", error);
//   }
// };

const addCartvalue = async (req, res) => {
  try {
    console.log("add cart value------------------------<,,,,,,,,<<<<<<");
    console.log("Cart value updating by user");
    console.log(req.body);
    const userID = req.session.userID;
    const cartData = await cartModel.find({ user: userID });
    console.log("cartData is : ", cartData);

    console.log("cart length is:", cartData[0].item.length);
    const product_id = req.body.productId;
    const quantity = req.body.quantity;
    const value = req.body.value;

    console.log(userID);
    const cartValue = await cartModel.aggregate([
      { $match: { user: new ObjectId(userID) } },
      { $unwind: "$item" },
      { $match: { "item.product": new ObjectId(product_id) } },
    ]);

    console.log(quantity, "1111111111111111111111111111");
    console.log(cartValue, "/=/=/=/=/=/=");
    let totalCartValue;
    if (value == 1) {
      totalCartValue = cartValue[0].item.product_quantity + 1;
    } else {
      totalCartValue = cartValue[0].item.product_quantity - 1;
    }

    console.log(
      totalCartValue,
      "-=-=-=-=-=--=-=-=-=-=-=--=-=-=-=-=-=-=-=-=-=--=-=-=-=-==--=-="
    );

    // const totalCartValue = cartValue[0].item.product_quantity;

    //------------------------------------------------------------------------------------

    console.log("User increased the count of the product id: ", product_id);
    console.log("The product quantity in cart is: ", totalCartValue);

    for (let i = 0; i < cartData[0].item.length; i++) {}

    const productCount = await productModel.findOne({ _id: product_id });
    console.log("Product stock available is:", productCount.stock);
    let proStock = productCount.stock;

    if (totalCartValue <= productCount.stock) {
      if ((totalCartValue >= 1) & (totalCartValue <= 8)) {
        console.log(totalCartValue);
        console.log("-----------------********--------------------------");
        await cartModel.updateOne(
          { user: userID, "item.product": product_id },
          { $set: { "item.$.product_quantity": totalCartValue } }
          // { $inc: { "item.$.product_quantity": req.body.value } }
        );
      }
      console.log("perform rest of the things");
      let aggregation_totalPrice = await cartModel.aggregate([
        {
          $match: { user: new ObjectId(userID) },
        },
        {
          $unwind: "$item",
        },
        {
          $match: { "item.product": new ObjectId(product_id) },
        },
      ]);

      let totalPrice = await cartModel.aggregate([
        {
          $match: { user: new ObjectId(userID) },
        },
        {
          $unwind: "$item",
        },
        {
          $group: {
            _id: "$item.product",
            totalRate: {
              $sum: {
                $multiply: ["$item.product_quantity", "$item.product_rate"],
              },
            },
          },
        },
      ]);

      let totalPriceSum = 0;

      totalPrice.forEach((item) => {
        totalPriceSum += item.totalRate;
      });
      console.log(
        "totalPriceSum is:------------------------------------*****",
        totalPriceSum
      );
      req.session.ShoppingCartAmount = totalPriceSum;
      console.log(
        "req.session.ShoppingCartAmount is: ",
        req.session.ShoppingCartAmount
      );
      console.log(
        totalPrice,
        "quantityquantityquantityquantityquantityquantityquantityquantity-----------   "
      );

      //end

      console.log(
        "aggregation result for getting total price: ",
        aggregation_totalPrice
      );

      productPrice =
        aggregation_totalPrice[0].item.product_quantity *
        aggregation_totalPrice[0].item.product_rate;
      res.header("Content-Type", "application/json").json({
        value: 0,
        productPrice: productPrice,
        totalPriceSum: totalPriceSum,
      });
    } else if (totalCartValue >= productCount.stock) {
      console.log("No stocks available");
      res.json({
        value: 1,
        message: "No more stocks available",
        proStock: proStock,
      });
    }

    //------------------------------------------------------------------------------------

    // if ((quantity >= 1) & (quantity <= 5)) {
    //   console.log(quantity);
    //   console.log("-----------------********--------------------------");
    //   await cartModel.updateOne(
    //     { user: userID, "item.product": product_id },
    //     { $inc: { "item.$.product_quantity": req.body.value } }
    //   );
    // }

    //---------------------------------------------------------------------------------------------------

    // let aggregation_totalPrice = await cartModel.aggregate([
    //   {
    //     $match: { user: new ObjectId(userID) },
    //   },
    //   {
    //     $unwind: "$item",
    //   },
    //   {
    //     $match: { "item.product": new ObjectId(product_id) }, // Match the product ID
    //   },
    //   {
    //     $lookup: {
    //       from: "products", // Collection name of products
    //       localField: "item.product",
    //       foreignField: "_id",
    //       as: "product",
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       productCount: "$item.product_quantity",
    //       productPrice: { $arrayElemAt: ["$product.rate_after_discount", 0] },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       totalPrice: { $multiply: ["$productCount", "$productPrice"] }, // Calculate total price
    //     },
    //   },
    // ]);

    //---------------------------------------------------------------------------------------------------

    // let aggregation_totalPrice = await cartModel.aggregate([
    //   {
    //     $match: { user: new ObjectId(userID) },
    //   },
    //   {
    //     $unwind: "$item",
    //   },
    //   {
    //     $lookup: {
    //       from: "products",
    //       localField: "item.product",
    //       foreignField: "_id",
    //       as: "product",
    //     },
    //   },
    //   {
    //     $project: {
    //       productName: { $arrayElemAt: ["$product.name", 0] },
    //       productCount: "$item.product_quantity",
    //       productRate: { $arrayElemAt: ["$product.rate_after_discount", 0] },
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$productName",
    //       totalCount: { $sum: "$productCount" },
    //       totalRate: { $sum: { $multiply: ["$productCount", "$productRate"] } },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       productName: "$_id",
    //       totalCount: 1,
    //       totalRate: 1,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       products: { $push: "$$ROOT" },
    //       totalCartSum: { $sum: "$totalRate" },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       products: 1,
    //       totalCartSum: 1,
    //     },
    //   },
    // ]);

    //test

    //temporary comment from here//

    // let aggregation_totalPrice = await cartModel.aggregate([
    //   {
    //     $match: { user: new ObjectId(userID) },
    //   },
    //   {
    //     $unwind: "$item",
    //   },
    //   {
    //     $match: { "item.product": new ObjectId(product_id) },
    //   },
    // ]);

    // let totalPrice = await cartModel.aggregate([
    //   {
    //     $match: { user: new ObjectId(userID) },
    //   },
    //   {
    //     $unwind: "$item",
    //   },
    //   {
    //     $group: {
    //       _id: "$item.product",
    //       totalRate: {
    //         $sum: {
    //           $multiply: ["$item.product_quantity", "$item.product_rate"],
    //         },
    //       },
    //     },
    //   },
    // ]);

    // let totalPriceSum = 0;

    // totalPrice.forEach((item) => {
    //   totalPriceSum += item.totalRate;
    // });
    // console.log(
    //   "totalPriceSum is:------------------------------------*****",
    //   totalPriceSum
    // );
    // req.session.ShoppingCartAmount = totalPriceSum;
    // console.log(
    //   "req.session.ShoppingCartAmount is: ",
    //   req.session.ShoppingCartAmount
    // );
    // console.log(
    //   totalPrice,
    //   "quantityquantityquantityquantityquantityquantityquantityquantity-----------   "
    // );

    // //end

    // console.log(
    //   "aggregation result for getting total price: ",
    //   aggregation_totalPrice
    // );
    // // total_product_count_in_cart = aggregation_totalPrice[0].products.length;
    // // productTotalValue = aggregation_totalPrice[0].products[0];
    // // productCount = aggregation_totalPrice[0].productCount;
    // // console.log("total price of the product is: ", productTotalValue);
    // productPrice =
    //   aggregation_totalPrice[0].item.product_quantity *
    //   aggregation_totalPrice[0].item.product_rate;
    // res.header("Content-Type", "application/json").json({
    //   // productTotalValue: productTotalValue,
    //   // productCount: productCount,
    //   productPrice: productPrice,
    //   totalPriceSum: totalPriceSum,
    // });
  } catch (error) {
    console.log("error occurred while addCartvalue in cartController", error);
  }
};

const checkout = async (req, res) => {
  try {
    console.log("User checkout page");
    console.log("-------------------");
    const category = await categoryModel.find({}); // to pass the category values in ejs file //
    const userID = req.session.userID;

    let address = await addressModel.find({ user: userID });
    console.log(address);
    console.log(address.length);

    // const cartProducts = await cartModel.findOne({ user: req.session.userID });
    // console.log("cartProducts  :", cartProducts);
    // const productCount = cartProducts.item.length;
    // for (let i = 0; i < productCount; i++) {
    //   console.log(cartProducts.item[i].product_quantity);
    // }
    // console.log("****");
    //const cartCount = cartProducts[0].item.length;
    totalAmount = req.session.ShoppingCartAmount;
    console.log("total cart amount is:  ", totalAmount); //total cart value passed to check out page //

    const shippingCharges = totalAmount > 200000 ? 0 : 1000;

    const totalCheckoutCharge = totalAmount + shippingCharges;

    console.log("total checkout page amount is:  ", totalCheckoutCharge);

    req.session.totalCheckoutCharge = totalCheckoutCharge;

    console.log(
      "req.session.cart_Value_after_coupon  is:",
      req.session.cart_Value_after_coupon
    );

    const checkoutPageValues = await cartModel.aggregate([
      {
        $match: { user: new ObjectId(userID) },
      },
      {
        $unwind: "$item",
      },
      {
        $lookup: {
          from: "products",
          localField: "item.product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          _id: 0,
          //productId: { $arrayElemAt: ["$product._id", 0] },
          productName: { $arrayElemAt: ["$product.name", 0] },
          productImage: { $arrayElemAt: ["$product.image", 0] },
          productPrice: { $arrayElemAt: ["$product.rate", 0] },
          productDiscountPrice: {
            $arrayElemAt: ["$product.rate_after_discount", 0],
          },
          productQuantity: "$item.product_quantity",
        },
      },
    ]);

    console.log("checkoutPageValues ::::", checkoutPageValues);
    let total = 0;
    for (let i = 0; i < checkoutPageValues.length; i++) {
      total +=
        checkoutPageValues[i].productDiscountPrice *
        checkoutPageValues[i].productQuantity;
    }

    console.log("TOTAL CHECKOUT VALUE IS: ", total);

    req.session.userCheckOutProductList = checkoutPageValues;

    console.log(
      "Just displaying cart first product details here::: ",
      checkoutPageValues[0].productName,
      checkoutPageValues[0].productPrice * checkoutPageValues[0].productQuantity
    );
    const user_ID = await userModel.findOne(
      { username: req.session.name },
      { _id: 1 }
    );
    console.log("USER ID is: ", user_ID);
    console.log("---------------------------------------");
    const wallet = await walletModel.findOne({ userId: user_ID });
    console.log("User wallet details is: ", wallet);

    console.log("Cart total is: (Subtotal) ", req.session.cartTotal);

    res.render("checkout", {
      user: req.session.name,
      category,
      totalAmount,
      checkoutPageValues,
      address,
      totalCheckoutCharge,
      shippingCharges,
      wallet,
      total,
    });
  } catch (error) {
    console.log("Error occurred while checkout", error);
  }
};

module.exports = {
  addToCart,
  cartPage,
  removeCart,
  checkout,
  // minusCartvalue,
  addCartvalue,
};
