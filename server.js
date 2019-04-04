'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');
var url = require('url');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// connect to mongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, function(error) {
  console.log(error);
});

// create schema and model for the database
var urlSchema = new mongoose.Schema({
  index: {type: Number, required: true},
  url: {type: String, required: true}
});

var URL = mongoose.model('URL', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Clear the database
URL.deleteMany({}, function (err) {
  console.log(err);
});

// check if an url is valid, provide a JSON response, and if valid save in the database
var index = 0;
app.post('/api/shorturl/new', function(req, res) {
  index++;
  const rawUrl = req.body.url;
  const parsedUrl = url.parse(rawUrl).host;
  dns.lookup(parsedUrl, function(err, address) {
    if (err || !address) {
      res.json({"error": "invalid URL"});
    } else {
      res.json({"original_url": parsedUrl, "short_url": index});
      const urlToDB = new URL({index: index, url: rawUrl});
      urlToDB.save();
    }
  });    
});

// when a shortened url is entered in the address bar, redirect to the corresponding web page
app.get('/api/shorturl/:urlCode', function(req, res) {
  URL.findOne({index: req.params.urlCode}, 'url', function(err, data) {
    if (err) console.log(err);
    res.redirect(data.url);
  });
}) ;

app.listen(port, function () {
  console.log('Node.js listening ...');
});
