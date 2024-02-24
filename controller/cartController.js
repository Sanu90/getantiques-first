const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const categoryModel = require("../model/categoryModel");
const cartModel = require("../model/cartModel");

const cart = async (req, res) => {
  const product_id = req.params.id;
  console.log("id :" + product_id);
  const category = await categoryModel.find({});
  const product = await productModel.findOne({ _id: product_id });
  console.log("Product details: " + product);
  console.log(product.name, product.image, product.rate);
  let cart = new cartModel({
    user: req.session.userID,
    item: [],
    product_quantity: 1,
  });
  const arrayValues = {
    product: product_id,
  };
  cart.item.push(arrayValues);
  console.log("CART USER IS:------< " + cart.user);
  console.log("CART ITEM IS:------< " + cart.item);

  // let cartData = await cartModel({
  //   user: req.session.userID,
  //   product_quantity: 1,
  // });
  await cart.save();
  console.log("arrayValues---------------->" + arrayValues.product);

  // const a = await cartModel.find({}).populate("product");
  // console.log(a);
  const b = await cartModel.find({}).populate("user");

  // console.log("Product details from populate: ", a);
  console.log("User details from populate: ", b);
  //let cartData = await cartModel({
  //   user: req.session.userID,
  //   product: product_id,
  //   product_quantity: 1,
  //   product_total_price: product[0].rate,
  //   cart_price: 200,
  // });
  // await cartData.save();
  res.render("cart", { user: req.session.name, category });
  console.log("Product added to cart");

  //const a = await cartModel.find({}).populate("product");
  //console.log(a[0].product.name);

  //console.log(id);
};

module.exports = { cart };
