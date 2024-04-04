// IMPORT MODULES //
const express = require("express");
const flash = require("express-flash");
const path = require("path");
require("dotenv").config();
const session = require("express-session");
const paginate = require("express-paginate");
const fs = require("fs");

//CONFIG INSTANCE FOR EXPRESS//
const app = express();

//MIDDLEWARES//
// app.use(nocache);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "secretvalue",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 500000,
    },
  })
);
//app.use(paginate.middleware(3, 10));

app.use(flash());
app.use((req, res, next) => {
  res.header("Cache-Control", "private,no-cache,no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
});

//SET VIEW ENGINE//
app.set("view engine", "ejs");

//SET PATH FOR VIEW FOLDER//
app.set("views", [
  path.join(__dirname, "./views/user"),
  path.join(__dirname, "./views/admin"),
]);

//SET PUBLIC FILES PATH//
app.use(express.static(path.join(__dirname, "public")));

//SETTING ROUTES FOR ADMIN, USER & ERROR PAGES//
const adminRoute = require("./route/adminRoute");
const userRoute = require("./route/userRoute");

app.use("/", userRoute);
app.use("/admin", adminRoute);
app.use("*", (req, res) => {
  res.render("error");
});

//SETUP SERVER PORT//
app.listen(7000, () => {
  console.log("Server running @7000");
});
