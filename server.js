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

// const createAndSaveShortenedURL = (done) => {
//   let createdShortenedURL = new shortenedURL();
//   console.log("test");
//   createdShortenedURL.original_url = "https://www.youtube.com";
//   createdShortenedURL.short_url = 1;
//   createdShortenedURL.save(function(err) {
//     if (err) {
//       return console.error(err);
//     }
//   });
// };

// const updateCount = (newCount, done) => {
//   shortenedURL.updateOne(
//     { original_url: "counter" },
//     { short_url: newCount },
//     function(err, data) {
//       if (err) {
//         console.log(err);
//         done(err);
//       }
//       console.log(data);
//       done(null, data);
//     }
//   );
// };

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

// app.get("/api/count", function (req, res) {
//   findDbCount(function (err, foundCount) {
//     if (err) {
//       res.json({ error: "error in getting count" });
//     }
//     console.log(foundCount.count);
//     res.json({ count: foundCount.count });
//   });
// });

const findOneByURL = (givenURL, done) => {
  console.log("looking by original-url");
  shortenedURL.findOne({ original_url: givenURL }, function(
    err,
    foundShortenedURL
  ) {
    if (err) {
      done(err);
    }
    done(null, foundShortenedURL);
    // return foundShortenedURL
  });
};

var func = bodyParser.urlencoded({ extended: false });
app.use(func);

app.post("/api/shorturl", function (req, res,) {
  const originalURL =
    req.body.url; /* gets input from frontend; should be a URL for a website  */
  var pattern = /^(([hH][tT][tT][pP]|[hH][tT][tT][pP][sS]):\/\/)/; // checks that url starts with http(s)://
  if (!pattern.test(originalURL)) {
    return res.json({ error: "Invalid URL, must start with 'https://'" });
  }
  const actualURL = new URL(originalURL);
  dns.lookup(
    actualURL.hostname,
    function (err, address, family) {
      // console.log(originalURL);
      if (err) {
        console.log(err);
        return res.json({ error: "Invalid Hostname" });
      }
    }),
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

          var count = foundCount.count;
          createAndSaveShortenedURL(originalURL, count + 1, function (err, data) {
            if (err) {
              return res.json({ error: "error in creating and saving url" });
            }
            else {
              return res.json({ original_url: data.original_url, short_url: data.short_url });
            }
          });
        });
      } else {
        console.log("found short url in database already");
              res.json({
                original_url: originalURL,
                short_url: foundShortenedURL.short_url
              });
      }
    })
  });





 // updateCount(count + 1, function(err, data) {
            //   if (err) {
            //     res.json({ error: "error in updating count" });
            //   }
            //   console.log(data);
            // });




      // if (foundShortenedURL === null) {
        // console.log("creating and saving new shortened_url");
        // findDbCount(function(err, foundCount) {
        //   if (err) {
        //     return res.json({ error: "error in finding count" });
        //   }
        //   var count = foundCount.count;
        //   createAndSaveShortenedURL(originalURL, count + 1, function(
        //     err,
        //     data
        //   ) {
        //     if (err) {
        //       res.json({ error: "error in creating and saving url" });
        //     }
        //     updateCount(count + 1, function(err, data) {
        //       if (err) {
        //         res.json({ error: "error in updating count" });
        //       }
        //       console.log(data);
        //     });
        //     done(null, data);
        //   });
      // } else {

      // } 





  


      // findOneByURL(originalURL, function(err, foundShortenedURL) {
      //   if (err) {
      //     return res.json({ error: "error in finding url" });
      //   }
      //   if (foundShortenedURL === null) {
      //     console.log("creating and saving new shortened_url");
      //     createAndSaveShortenedURL(originalURL, count + 1, function(
      //       err,
      //       data
      //     ) {
      //       if (err) {
      //         res.json({ error: "error in creating and saving url" });
      //       }
      //       updateCount(count + 1, function(err, data) {
      //         if (err) {
      //           res.json({ error: "error in updating count" });
      //         }
      //         console.log(data);
      //       });
      //       done(null, data);
      //     });
      //   }
      //   console.log("hello");
      //   res.json({
      //     original_url: originalURL,
      //     short_url: foundShortenedURL.short_url
      //   });
      // });
//     })
//   );
// });

const findOneByShortURL = (shortURL, done) => {
  console.log("looking by short-url");
  shortenedURL.findOne({ short_url: shortURL }, function(err, foundShortenedURL) {
    if (err) {
      // console.log("ERROR");
      done(err);
    }
    console.log(foundShortenedURL);
    done(null, foundShortenedURL);
  });
};

app.get("/api/shorturl/:short_url", function(req, res) {
  var short_url = req.params.short_url;
  findOneByShortURL(Number(short_url), function(err, foundURL) {
    if (err) {
      res.send("ERROR");
      return;
    }
    if (foundURL === null) {
      res.json({ error: "No short URL found for the given input" });
      return;
    }
    var original_url = foundURL.original_url;
    res.redirect(original_url);
    return;
  });
});

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
