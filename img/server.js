var path = require('path');
var express = require('express');
var app = express();

var dir = path.join(__dirname, '');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(dir));

app.listen(9001, function () {
    console.log('Listening on http://localhost:9001/');
});
