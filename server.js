require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
var bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

mongoose.connect(
  "mongodb+srv://josejassojr:y0ekuPLAaPeTh8G6@cluster0.htefv.mongodb.net/urlDatabase?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

var func = bodyParser.urlencoded({ extended: false });
app.use(func);
app.post("/api/shorturl", function (req, res) {
  dns.lookup(req.body.url, function (err, address, family) {
    if (err) {
      console.log(err)
      return console.log("Not an appropiate address! Try Again!");
    }
    console.log("ip address of " + req.body.url + " is " + address);
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
