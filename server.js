require("dotenv").config({ path: "file.env" });
const express = require("express");
const mongoose = require("mongoose");
const dns = require("dns");
var bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

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


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Schema = mongoose.Schema;

const shortenedURLSchema = new Schema({
  original_url: { type: String },
  short_url: { type: Number },
  counter: { type: Boolean, required: true },
  count: { type: Number }
});

const shortenedURL = mongoose.model("Shortened_URL", shortenedURLSchema);

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

const findDbCount = done => {
  shortenedURL.findOne({ counter: true }, function(err, foundCount) {
    if (err) {
      console.log("error in getting count");
      done(err);
    }
    done(null, foundCount);
  });
};

const findOneByURL = (givenURL, done) => {
  console.log("looking by original-url");
  shortenedURL.findOne({ original_url: givenURL }, function handleFindOneByURL(
    err,
    foundShortenedURL
  ) {
    if (err) {
      done(err);
    } else {
      done(null, foundShortenedURL);
    }
  });
};

var func = bodyParser.urlencoded({ extended: false });
app.use(func);

app.post("/api/shorturl", handlePostRequest);

function handlePostRequest(req, res) {
  try {
    new URL(req.body.url); // checking for error in creating URL from input
  } catch (err) {
    console.log("error with input url");
    return res.json({ error: "Invalid URL" });
  }
  const actualURL = new URL(req.body.url);
  if (actualURL.protocol != "https:" && actualURL.protocol != "http:") {
    console.log("url does not contain 'https://'");
    return res.json({ error: "Invalid URL" });
  } else {
    console.log("actual URL is");
    console.log(actualURL);
    dns.lookup(actualURL.hostname, function handleDNSLookup(err, address, family) {
      if (err) {
        console.log(err);
        console.log("invalid hostname");
        res.json({ error: "Invalid Hostname" });
      } else {
        originalURL = actualURL.href;
        console.log(originalURL);
        findOneByURL(originalURL, function handleFoundURL(err,foundShortenedURL) {
          if (err) {
            console.log("error in finding url");
            res.json({ error: "error in finding url" });
          } else if (foundShortenedURL === null) {
            console.log("creating and saving new shortened_url");
            findDbCount(function handleFoundCount(err, foundCount) {
              if (err) {
                console.log("error in finding count");
                res.send("Error in finding count");
              } else if (foundCount === null) {
                res.send("No found Count");
              } else {
                var count = foundCount.count + 1;
                console.log("saving original url:" + originalURL + " with short url:" + String(count));
                createAndSaveShortenedURL( originalURL, count, function handleSavedShortenedURL(err, savedData) {
                    if (err) {
                      console.log("error in saving new shortened url");
                      res.json({ error: "Error in saving new shortened url" });
                    } else {
                      shortenedURL.findOneAndUpdate(
                        { counter: true },
                        { count: count },
                        function handleUpdateOne(err, updatedCount) {
                          if (err) {
                            console.log("error in updating count");
                            console.log(err);
                            return res.json({ error: "error in updating count" });
                          } else {
                            console.log("updated count successfully");
                            console.log(updatedCount);
                            return res.json({ original_url: originalURL, short_url: count });
                          }
                        }
                      );
                    }
                  }
                );
              }
            });
          } else {
            console.log("found short url in database already");
            res.json({
              original_url: foundShortenedURL.original_url,
              short_url: foundShortenedURL.short_url
            });
          }
        });
      }
    }); 
  }
}

app.get("/api/shorturl?/", function(req, res) {
  console.log("error: input a number for short url");
  res.json({ error: "Input a Number for Short URL" });
});

app.get("/api/shorturl/:short_url", function handleGetShortURL(req, res) {
  console.log(req.params);
  var short_url = req.params.short_url;
  console.log("short_url is " + String(short_url));
  console.log("looking by short-url");
  shortenedURL.findOne(
    { short_url: Number(short_url) },
    function handleFindOneByShortURL(err, foundURL) {
      if (err) {
        res.json({ error: "Wrong format" });
      }
      return res.redirect(foundURL.original_url);
    }
  );
});

app.get("/api/all", function(req, res) {
  shortenedURL.find({ counter: false }, function(err, foundContent) {
    if (err) {
      console.log(" line 190 error in finding all content");
      res.json({ error: "error in finding all content" });
    } else {
      const dbContents = foundContent.map(x => ({
        original_url: x.original_url,
        short_url: x.short_url
      }));
      console.log("line 199 sending contents of db");
      res.send(dbContents);
    }
  });
});


