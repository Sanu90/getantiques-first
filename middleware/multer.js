//const path = require("path");
const multer = require("multer");
//const sharp = require("sharp");

//MULTER CONFIGURATION//

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/upload/");
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().getTime();
    cb(null, timestamp + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
