var DEBUG = false;

var formidable = require('formidable');
var express = require('express');
var fs = require('fs');
var querystring = require('querystring');

var app = express.createServer();

app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.options(/^\/restdesc\/photos$/, optionsPhotos);

app.post(/^\/restdesc\/photos$/, postPhoto);

app.get(/^\/restdesc\/photos$/, getPhotos);

app.get(/^\/restdesc\/photos\/\d+$/, getPhoto);

app.get(/^\/restdesc\/photos\/\d+\/faces$/, getFaces);

app.get(/^\/restdesc\/photos\/\d+\/faces\/\d+$/, getFace);

app.get(/^\/restdesc\/photos\/\d+\/persons\/\d+$/, getPerson);

var port = process.env.PORT || 8001;
var host = process.env.HOST || '127.0.0.1';

function optionsPhotos(req, res, next) {
  res.send('OPTIONS\n');  
}

function getPhotos(req, res, next) {
  res.send('GET\n');  
}

function getPhoto(req, res, next) {
  var path = /^\/restdesc\/photos\/(\d+)$/;
  var pathname = require('url').parse(req.url).pathname;
  var id = pathname.replace(path, '$1');
  var accept = req.header('Accept', '*/*');
  console.log('Accept: ' + accept);
  if ((accept.indexOf('image/jpg') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
    var location = 'http://' + host + ':' + port + '/restdesc/photos/' + id +
        '/faces';
    res.header('Content-Type', 'image/jpg');
    res.header('Link', '<' + location +
        '>; rel="describedby"; title="contained faces"; type="text/n3"');
    fs.readFile(__dirname + '/photos/' + id + '.jpg', function (err, data) {
      if (err) throw err;
      res.send(data);
    });      
  }
}

function postPhoto(req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {    
    //res.write('received upload:\n\n');
    //res.end(sys.inspect({fields: fields, files: files}));
    var file = files.photo.name;
    var id;
    if (file) {
      if (file === 'obama-gillard.jpg') {
        id = 1;
      } else if (file === 'obama-kenny.jpg') {
        id = 2;
      } else if (file === 'obama-rousseff.jpg') {
        id = 3;
      }
      console.log('Photo ID ' + id);
      var location = 'http://' + host + ':' + port + '/restdesc/photos/' + id;
      res.header('Location', location)
      res.header('Content-Type', 'text/html');
      res.send('Your photo was uploaded: <a href="' + location + '">' +
          location + '</a>\n', 201);
    } else {
      next();
    }    
  });
  return; 
}

function getFaces(req, res, next) {
  var path = /^\/restdesc\/photos\/(\d+)\/faces$/;
  var pathname = require('url').parse(req.url).pathname;
  var id = pathname.replace(path, '$1');
  var accept = req.header('Accept', '*/*');
  if ((accept.indexOf('text/n3') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {  
    fs.readFile(__dirname + '/photos/' + id + '.n3', function (err, data) {
      if (err) throw err;
      res.header('Content-Type', 'text/n3');
      var relatedCount = {'1': 2, '2': 4, '3': 6}[id];
      var linkHeaders = '';
      for(var faceId = 1; faceId <= relatedCount; faceId++) {
        var location1 = 'http://' + host + ':' + port + '/restdesc/photos/' +
            id + '/faces/' + faceId;
        var personId = faceId;    
        var location2 = 'http://' + host + ':' + port + '/restdesc/photos/' +
            id + '/persons/' + personId;

        linkHeaders += (faceId > 1 ? ',\n      ' : '') + '<' + location1 +
            '>; rel="related"; title="contained face"; type="image/jpg"' +
            ',\n      <' + location2 +
            '>; rel="related"; title="contained face"; type="text/plain"';        
      }
      res.header('Link', linkHeaders);
      res.send(data);
    });      
  }
}

function getFace(req, res, next) {
  var path = /^\/restdesc\/photos\/(\d+)\/faces\/(\d+)$/;
  var pathname = require('url').parse(req.url).pathname;
  var accept = req.header('Accept', '*/*');
  if ((accept.indexOf('image/jpg') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {  
    var fileName = __dirname + pathname.replace(path, '/photos/$1_$2.jpg');
    fs.readFile(fileName, function (err, data) {
      if (err) throw err;
      res.header('Content-Type', 'image/jpg');
      res.send(data);
    });      
  }
}

function getPerson(req, res, next) {
  var path = /^\/restdesc\/photos\/(\d+)\/persons\/(\d+)$/;
  var pathname = require('url').parse(req.url).pathname;
  var fileName = __dirname + pathname.replace(path, '/photos/$1_$2');
  var accept = req.header('Accept', '*/*');
  if((accept.indexOf('text/n3') !== -1)) {
      fs.readFile(fileName + '.n3', function (err, data) {
        if (err) throw err;
        res.header('Content-Type', 'text/n3');
        res.send(data);
      });
  }
  else if ((accept.indexOf('text/plain') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
    fs.readFile(fileName + '.txt', function (err, data) {
      if (err) throw err;
      res.header('Content-Type', 'text/plain');
      res.send(data);
    });      
  }
}

app.listen(port);
console.log('node.JS running on http://' + host + ':' + port);