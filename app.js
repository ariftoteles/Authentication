require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

// Setup session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

//initialize passport and use passport to manage session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true 
});
mongoose.set("useCreateIndex", true); // ignore depreciate warning

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String // to save googleID in database local
});
// use passport local mongoose plugin to set up user schema
userSchema.plugin(passportLocalMongoose);
// add plugin findorcreate
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// use passport local mongoose to create login local strategy
passport.use(User.createStrategy());

// setup passport to serialize and deserialize 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
 // setup passport using google strategy 
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// =================ROUTING===================//
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secret.
    res.redirect("/secrets");
  });

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
          console.log(err);
          res.redirect("/register");
      } else {
          passport.authenticate("local")(req, res, function(){
              res.redirect("/secrets");
          });
      }
  });
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if (err){
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    })

});

app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
})

app.listen(3000, function () {
    console.log("Server starting on port 3000");
});