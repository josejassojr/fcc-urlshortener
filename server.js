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
  original_url: { type: String },
  short_url: { type: Number},
  counter: { type: Boolean, required: true },
  count: { type: Number }
});

const shortenedURL = mongoose.model("Shortened_URL", shortenedURLSchema);

const updateCount = (newCount, done) => {
  shortenedURL.updateOne({ counter: true },{ count: newCount }, function(err, data) {
      if (err) {
        console.log(err);
        done(err);
      }
      console.log(data);
      done(null, data);
    }
  );
};

const createAndSaveShortenedURL = (originalURL, short_url, done) => {
  let createdShortenedURL = new shortenedURL();
  createdShortenedURL.original_url = originalURL;
  createdShortenedURL.short_url = short_url;
  createdShortenedURL.counter = false;
  createdShortenedURL.save(function(err, data) {
    if (err) {
      console.log(err);
      console.error("error in creating and saving document");
      done(err);
    }
    done(null, data);
  });
};

const findDbCount = (done) => {
  shortenedURL.findOne({ counter: true }, function(err, foundCount) {
    if (err) {
      console.log("error in getting count");
      done(err);
    }
    console.log(foundCount);
    done(null, foundCount);
  });
};

const findOneByShortURL = (shortURL, done) => {
  console.log("looking by short-url");
  shortenedURL.findOne({ short_url: shortURL }, function(err, foundShortenedURL) {
    if (err) {
      done(err);
    } 
    else {
      console.log(foundShortenedURL);
      done(null, foundShortenedURL);
    }
  });
};

const findOneByURL = (givenURL, done) => {
  console.log("looking by original-url");
  shortenedURL.findOne({ original_url: givenURL }, function(err, foundShortenedURL) {
    if (err) {
      done(err);
    }
    else {
      done(null, foundShortenedURL);
    }
  });
};

var func = bodyParser.urlencoded({ extended: false });
app.use(func);

app.post("/api/shorturl", function (req, res,) {
  const originalURL = req.body.url; /* gets input from frontend; should be a URL for a website  */
  var pattern = /^(([hH][tT][tT][pP]|[hH][tT][tT][pP][sS]):\/\/)/; // checks that url starts with http(s)://
  if (!pattern.test(originalURL)) {
    return res.json({ error: "invalid url" });
  }
  const actualURL = new URL(originalURL);
  dns.lookup( actualURL.hostname, function (err, address, family) {
      if (err) {
        console.log(err);
        return res.json({ error: "Invalid Hostname" });
      }
    },
    findOneByURL(originalURL, function (err, foundShortenedURL) {
      if (err) {
        return res.json({ error: "error in finding url" });
      }
      if (foundShortenedURL === null) {
        console.log("creating and saving new shortened_url");
        findDbCount(function (err, foundCount) {
          if (err) {
            return res.json({ error: "error in finding count" });
          }
          if (foundCount === null) {
            return json({ error: "could not find count" });
          }
          
          var count = foundCount.count + 1;
          createAndSaveShortenedURL(originalURL, count, function (err, data) {
            if (err) {
              return res.json({ error: "error in creating and saving url" });
            }
            else {
              res.json({ original_url: data.original_url, short_url: data.short_url });
            }
          },
          updateCount(count, function(err, data) {
            if (err) {
              console.log("error in updating count");
            }
            console.log("successfully updated count");
            console.log(data);
            return
          })  
          );
        });
      } else {
        console.log("found short url in database already");
              res.json({
                original_url: originalURL,
                short_url: foundShortenedURL.short_url
              });
      }
    }))
  });


app.get("/api/shorturl/", function (req, res) {
  res.json({ error: "Input a Number for Short URL" });
  return;
})

app.get("/api/shorturl/:short_url", function (req, res) {
  var short_url = req.params.short_url;
  findOneByShortURL(Number(short_url), function(err, foundURL) {
    if (err) {
      res.json({ error: "Wrong format" });
      return;
    }
    else if (foundURL === null) {
      res.json({ error: "No short URL found for the given input" });
      return;
    }
    else {
      console.log("here");
      var original_url = foundURL.original_url;
      res.redirect(original_url);
      return;
    }
  });
});

app.get("/api/all", function (req, res) {
  shortenedURL.find({ counter: false }, function (err, foundContent) {
    if (err) {
      res.json({ error: "error in finding all content" });
      return;
    }
    else {
      const dbContents = foundContent.map(x => ({
        original_url: x.original_url,
        short_url: x.short_url
      }));;
      res.send(dbContents);
      return;
    }
  })
})

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
