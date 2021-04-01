require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const lodash = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.PASSSECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const saltRounds = 7;

let docs = [];
let searchStr = "";

mongoose.connect(process.env.MONGOURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    require: true,
  },
  // role: {type: String, default: "readOnly"}
});

userSchema.plugin(passportLocalMongoose);

const documentSchema = new mongoose.Schema({
  dept: String,
  district: String,
  docId: Number,
  docLocation: String,
  docType: String,
  partyName: String,
  pinCode: Number,
  tehsil: String,
  vpo: String,
});

const Document = mongoose.model("Documents", documentSchema);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/").get((req, res) => {
  res.render("home");
});

app
  .route("/register")
  .get((req, res) => {
    res.render("home");
  })
  .post((req, res) => {
    let userName = req.body.username;
    let password = req.body.password;

    console.log(req.body);
    User.register({ username: userName }, password, (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        console.log(user);
        console.log("Registered successfully");
        // res.redirect("/");

        passport.authenticate("local")(req, res, () => {
          console.log(res);
          res.redirect("/search");
        });
      }
    });
  });

app
  .route("/login")
  .get((req, res) => {
    res.render("home");
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });
    console.log(user);
    req.login(user, (err) => {
      if (err) {
        console.log(err.message);
      } else {
        passport.authenticate("local")(req, res, () => {
          res.send("hi");
        });
      }
    });
  });

app
  .route("/search")
  .get((req, res) => {
    res.render("search", { docs: docs, searchStr: searchStr });
  })
  .post((req, res) => {
    Document.find(
      { $text: { $search: req.body.searchString } },
      { score: { $meta: "textScore" } },
      (err, result) => {
        if (err) {
          res.send(err);
        } else {
          docs = result;
          searchStr = req.body.searchString;
          res.redirect("/search");
        }
      }
    ).sort({ score: { $meta: "textScore" } });
  });

app.route("/admin").get((req, res) => {
  res.render("admin");
});

app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3000");
});
