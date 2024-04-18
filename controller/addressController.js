const addressModel = require("../model/userAddressModel");
const userModel = require("../model/userModel");
//const productModel = require("../model/productModel");

const newAddress = (req, res) => {
  try {
    res.render("userAddAddress");
  } catch (error) {
    console.log("Error when accessing newAddress : " + error);
  }
};

const address = async (req, res) => {
  try {
    console.log("*******************************GGGGHFHVVV*");
    // let address = await addressModel.find({user: req.session.userID}).populate('user');
    // let address = await addressModel
    //   .find({ user: req.session.userID })
    //   .populate("user");

    // console.log(address);
    // console.log(address[0].user.email);
    // } catch (error) {
    // //let address = await addressModel.find({ user: req.session.userID });
    // //   .populate("user");
    // // console.log(address);

    let address = await addressModel.find({ user: req.session.userID });
    console.log("USER ADDRESS IS: ", address);
    console.log("Total Address available for the user: " + address.length);
    res.render("userAddress", { userAddress: address });
    console.log("Error when accessing address : " + error);
  } catch (error) {
    console.log("Error happened in address of addressController");
  }
};

const saveAddress = async (req, res) => {
  try {
    console.log("Address details:", req.body);
    let userAddress = new addressModel({
      user: req.session.userID,
      customerName: req.body.Fullname,
      mobile: req.body.mobile,
      houseName: req.body.house,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      pincode: req.body.pincode,
    });
    console.log("userAddress is :" + userAddress);
    await userAddress.save();
    console.log("Address saved");
    res.redirect("/account/address");
  } catch (error) {
    console.log("Error while accessing saveAddress : " + error);
  }
};

const editAddress = async (req, res) => {
  try {
    const id = req.params.id;
    req.session.addressID = id;

    let data = await addressModel.findOne({ _id: id });
    console.log(data);
    res.render("userEditAddress", { data: data });
    console.log(data.customerName);
  } catch (error) {
    console.log("Error happened while editAddress : " + error);
  }
};

const updateAddress = async (req, res) => {
  try {
    console.log("----------------------");
    console.log(req.session.addressID);
    await addressModel.updateOne(
      { _id: req.session.addressID },
      {
        $set: {
          customerName: req.body.Fullname,
          mobile: req.body.mobile,
          houseName: req.body.house,
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          pincode: req.body.pincode,
        },
      }
    );
    res.redirect("/account/address");
  } catch (error) {}
};

const deleteAddress = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("ADDRESS ID TO BE DELETED is:  " + id);
    await addressModel.deleteOne({ _id: id });
    console.log("Address deleted");
    res.redirect("/account/address");
  } catch (error) {
    console.log("Error happened while deleteAddress: " + error);
  }
};

const showAddressInCheckout = async (req, res) => {
  try {
    console.log("showAddressInCheckout");
    let address = await addressModel.find({ user: req.session.userID });
    console.log(address[0].houseName + address[0].street);
  } catch (error) {
    console.log("Error happened while showAddressInCheckout: " + error);
  }
};

const saveNewAddressfromCheckout = async (req, res) => {
  try {
    console.log("User saving new address from checkout");
    console.log(req.body);
    console.log(req.session.userID);
    console.log(req.session.name);
    let userNewAddress = new addressModel({
      user: req.session.userID,
      customerName: req.body.fullname,
      mobile: req.body.mobile,
      houseName: req.body.house,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      pincode: req.body.pincode,
    });
    console.log("USER new Address saved from checkout is :" + userNewAddress);
    await userNewAddress.save();
    console.log("USER new address is saved.");
    // window.alert("Your address is saved.");
    res.redirect("/checkout");
  } catch (error) {
    console.log(
      "Error happened while saveNewAddressfromCheckout in addressController: " +
        error
    );
  }
};

module.exports = {
  address,
  newAddress,
  saveAddress,
  editAddress,
  updateAddress,
  deleteAddress,
  showAddressInCheckout,
  saveNewAddressfromCheckout,
};
