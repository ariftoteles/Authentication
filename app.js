require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function (err) {
            if (!err) {
                res.render("secrets");
            } else {
                console.log(err);
            }
        });
    });

});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", function (req, res) {
    const email = req.body.username;
    const password = req.body.password;

    User.findOne({email: email}, function (err, foundUser) {
        if (!err) {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    // result = true
                    if(result){
                        res.render("secrets")
                    }
                });
            }
        } else {
            console.log(err);
        }
    });
});

app.listen(3000, function () {
    console.log("Server starting on port 3000");
});