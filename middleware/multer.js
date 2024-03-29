//const path = require("path");
const multer = require("multer");
const sharp = require("sharp");

//MULTER CONFIGURATION//

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/upload/");
    console.log("is this working??--------> multer destination");
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().getTime();
    cb(null, timestamp + "-" + file.originalname);
    console.log("is this working??--------> multer filename");
  },
});

const upload = multer({ storage: storage });
//-----------------------------------//
//IMAGE CROP CONFIGURATION//
// const imageCrop = (req, res, next) => {
//   if (!req.files || req.files.length == 0) {
//     return next();
//   }
// };

module.exports = upload;
