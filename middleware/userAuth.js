const userModel = require("../model/userModel");

const isUser = async (req, res, next) => {
  try {
    if (!req.session.isUser) {
      res.redirect("/");
    } else {
      console.log("req.session.isUser ====" + req.session.isUser);
      const name = req.session.sessionName;
      console.log("NAME IS : " + name);
      isBlock = await userModel.findOne({ username: name });
      console.log("isBlock value in userAuth middleware is: " + isBlock);
      console.log(isBlock.hide);
      if (req.session.isUser && isBlock.hide == 0) {
        //const userName = req.session.name;
        next();
      } else {
        req.session.isUser = false;
        // res.redirect("/admin/?errorMessage=session out");
        console.log("************************************");
        res.redirect("/login");
      }
    }
  } catch (e) {
    console.log("user controller isUser " + e);
  }
};
module.exports = { isUser };
