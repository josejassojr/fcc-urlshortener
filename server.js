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
  short_url: { type: Number },
  counter: { type: Boolean, required: true },
  count: { type: Number }
});

const shortenedURL = mongoose.model("Shortened_URL", shortenedURLSchema);

function handleUpdateOne(err, updatedShortenedURL, done) {
  if (err) {
      console.log("error in handleUpdateOne")
    console.log(err);
    done(err);
    }
  console.log(updatedShortenedURL);
  done(null, updatedShortenedURL);
}
  
const updateCount = (newCount, done) => {
  shortenedURL.findOneAndUpdate({ counter: true },
  { count: newCount },
  handleUpdateOne)
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

const findDbCount = done => {
  shortenedURL.findOne({ counter: true }, function(err, foundCount) {
    if (err) {
      console.log("error in getting count");
      done(err);
    }
    done(null, foundCount);
  });
};

function handleFindOne(err, foundShortenedURL, done) {
  if (err) {
    console.log("error in handleUpdateOne");
    console.log(err);
  } else {
    done(null, foundShortenedURL);
  }
}




const findOneByURL = (givenURL, done) => {
  console.log("looking by original-url");
  shortenedURL.findOne({ original_url: givenURL }, function(err, foundShortenedURL) {
    if (err) {
      done(err);
    } else {
      done(null, foundShortenedURL);
    }
  });
};

var func = bodyParser.urlencoded({ extended: false });
app.use(func);


function handlePostRequest(req, res) {
  try {
    new URL(req.body.url); // checking for error in creating URL from input
  } catch (err) {
    console.log("error with input url");
    return res.json({ error: "invalid url" });
  }
  const actualURL = new URL(req.body.url);
  console.log()
  if (actualURL.protocol != 'https:' && actualURL.protocol != 'http:') {
    console.log("url does not contain 'https://'")
    return res.json({ error: "invalid url" });
  } else {
    console.log("actual URL is");
    console.log(actualURL);
    dns.lookup(actualURL.hostname, handleDNSLookup);
  }
}

app.post("/api/shorturl", handlePostRequest);


function handleDNSLookup(err, address, family) {
  if (err) {
    console.log(err);
    console.log("line 105 invalid hostname");
    res.json({ error: "Invalid Hostname" });
  } else {
    findOneByURL(actualURL.href, function handleFindOneByURL(err, foundShortenedURL,) {
      if (err) {
        console.log("line 111 error in finding url");
        res.json({ error: "error in finding url" });
      } else if (foundShortenedURL === null) {
        console.log("creating and saving new shortened_url");
        findDbCount(function(err, foundCount) {
          if (err) {
            console.log("line 118 error in finding count");
            res.json({ error: "error in finding count" });
          }
          if (foundCount === null) {
            console.log("line 122 could not find count");
            res.json({ error: "could not find count" });
          }
          var count = foundCount.count + 1;
          console.log("new count is " + String(count));
          createAndSaveShortenedURL(actualURL.href, count, function(err, data) {
            var savedData = data;
            if (err) {
              console.log("line 129 error in creating and saving url");
              res.json({ error: "error in creating and saving url" });
            } else {
              console.log("line 133 sending original url and short url");
              updateCount(count, function(err, data) {
                if (err) {
                  console.log("error in updating count");
                }
                console.log("successfully updated count");
              });
              res.json({
                original_url: savedData.original_url,
                short_url: savedData.short_url
              });
            }
          });
        });
      } else {
        console.log("line 148 found short url in database already");
        res.json({
          original_url: foundShortenedURL.original_url,
          short_url: foundShortenedURL.short_url
        });
      }
    });
  }
}




  






  // const originalURL = req.body.url; /* gets input from frontend; should be a URL for a website  */
  // var pattern = /^(([hH][tT][tT][pP]|[hH][tT][tT][pP][sS]):\/\/)/; // checks that url starts with http(s)://
  // if (!pattern.test(originalURL)) {
  //   console.log("line 98 invalid url");
  //   res.json({ error: "invalid url" });
  // // } else {
  //   const actualURL = new URL(originalURL);
  //   console.log(actualURL)
  //   // dns.lookup(actualURL.hostname, function(err, address, family) {
  //   //   if (err) {
  //   //     console.log(err);
  //   //     console.log("line 105 invalid hostname");
  //   //     res.json({ error: "Invalid Hostname" });
  //   //   } else {
        
  //     // }
  //   // });
  // }
// });

app.get("/api/shorturl?/", function(req, res) {
  console.log("line 159 error: input a number for short url");
  res.json({ error: "Input a Number for Short URL" });
});

app.get("/api/shorturl/:short_url", handleGetShortURL);

function handleGetShortURL(req, res) {
  console.log(req.params);
  var short_url = req.params.short_url;
  console.log("short_url is " + String(short_url));
  findOneByShortURL(Number(short_url), function handleFoundShortURL(err, foundURL) {
    console.log(err)
    console.log(foundURL);
    if (err) {
      console.log("error: wrong format");
      console.log(err);
      return res.json({ error: "Wrong format" });
    } else {
      var original_url = foundURL.original_url;
      console.log("line 180 redirecting url");
      return res.redirect(original_url);
    }
  });
  }




// function handleFindOneByShortURL(foundURL) {
//   console.log("here");
//   var original_url = foundURL.original_url;
//   console.log("line 180 redirecting url");
//   return res.redirect(original_url);
// }

const findOneByShortURL = (shortURL, done) => {
  console.log("looking by short-url");
  shortenedURL.findOne({ short_url: shortURL }, function handleFindOneByShortURL(err, foundURL) {
    if (err) {
      done(err);
    } else {
      done(null, foundURL);
      // console.log("here");
      // var original_url = foundURL.original_url;
      // console.log("line 180 redirecting url");
      // console.log(foundURL);
      // return res.json(foundURL);
    }
      // return res.redirect(original_url);
    }
  );
};

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
