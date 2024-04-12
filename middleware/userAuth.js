const userModel = require("../model/userModel");

const isUser = async (req, res, next) => {
  try {
    if (!req.session.isUser) {
      res.redirect("/");
    } else {
      console.log("req.session.isUser ====" + req.session.isUser);
      const name = req.session.sessionName;
      console.log("NAME IS : " + name);
        if (req.session.isUser) {
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
