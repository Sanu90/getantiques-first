const isAdmin = (req, res, next) => {
  try {
    if (req.session.isAdmin) {
      console.log('req.session.isAdmin')
      next();
    } else {
      console.log('no session available')
      // res.redirect("/admin/?errorMessage=session out");
      res.redirect("/admin");
    }
  } catch (error) {
    console.log("admin controller admin.js checkAdmin " + error);
  }
};

module.exports = { isAdmin };
