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

const Schema = mongoose.Schema;

const shortenedURLSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true },
});


const shortenedURL = mongoose.model("Shortened_URL", shortenedURLSchema);

const createAndSaveShortenedURL = (done) => {
  let createdShortenedURL = new shortenedURL();
  console.log("test");
  createdShortenedURL.original_url = "https://www.youtube.com";
  createdShortenedURL.short_url = 1;
  createdShortenedURL.save(function(err) {
    if (err) {
      return console.error(err);
    }
  });
};

const createAndSaveDocument = (originalURL) => {
  let createdShortenedURL = new shortenedURL();
  createdShortenedURL.original_url = originalURL;
  createdShortenedURL.short_url = 1;
  createdShortenedURL.save(function(err) {
    if (err) {
      return console.error(err);
    }
  });
}


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
  var originalURL = req.body.url;
  dns.lookup(originalURL, function (err, address, family) {
    if (err) {
      console.log(err);
      console.log("ip address of " + originalURL + " is " + address);
      res.json({ error: "Invalid Hostname" });
      return
    }
    createAndSaveDocument(originalURL);
    res.json({ original_url: originalURL, short_url: 1 });
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
