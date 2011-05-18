var DEBUG = false;

var formidable = require('formidable');
var express = require('express');
var fs = require('fs');
var querystring = require('querystring');

var app = exports.server = express.createServer();

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

app.options(/^\/$/, optionsBase);
app.get(/^\/$/, getBase);

app.options(/^\/photos$/, optionsPhotos);
app.get(/^\/photos$/, getPhotos);

app.post(/^\/photos$/, postPhoto);

app.get(/^\/photos\/\d+$/, getPhoto);
app.options(/^\/photos\/\d+$/, optionsPhoto);

app.get(/^\/photos\/\d+\/faces$/, getFaces);

app.get(/^\/photos\/\d+\/faces\/\d+$/, getFace);

app.get(/^\/photos\/\d+\/persons\/\d+$/, getPerson);

var port;
var host;

app.start = function(serverPort, serverHost) {
  port = serverPort || 8001;
  host = serverHost || '127.0.0.1';
  this.listen(port);
  console.log('node.JS running on http://' + host + ':' + port);
}

function getBase(req, res, next) {
  optionsBase(req, res, next);  
}

function optionsBase(req, res, next) {  
  res.header('Link', '<./>; rel=self,\n      <./photos>; rel=index; type=text/n3;charset=utf-8');
  res.header('Allow', 'GET, OPTIONS');
  var accept = req.header('Accept', '*/*');
  console.log('Accept: ' + accept);
  var message;
  if ((accept.indexOf('text/html') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
    res.header('Content-Type', 'text/html; charset=utf-8');    
    message = 'These are your current OPTIONS:\n<ul>\n' +
        '<li><a href="./photos">./photos</a></li>\n' +
        '</ul>\n';
  }
  res.send(message, 200);  
}

function getPhotos(req, res, next) {
  optionsPhotos(req, res, next);  
}

function optionsPhotos(req, res, next) {
  res.header('Link', '<./>;\n      rel=index;\n      rel=self');
  res.header('Allow', 'GET, OPTIONS, POST');  
  var accept = req.header('Accept', '*/*');
  console.log('Accept: ' + accept);  
  var message;
  if ((accept.indexOf('text/html') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
    res.header('Content-Type', 'text/html; charset=utf-8');      
    message = 'These are your current OPTIONS:\n<ul>\n' +
        '<li><a href="./photos" rel="self">./photos</a></li>\n' +
        '<li><a href="./photos/1" rel="http://xmlns.com/foaf/0.1/Image">./photos/1</a></li>\n' +
        '<li><a href="./photos/2" rel="http://xmlns.com/foaf/0.1/Image">./photos/2</a></li>\n' +            
        '<li><a href="./photos/3" rel="http://xmlns.com/foaf/0.1/Image">./photos/3</a></li>\n' +                  
        '</ul>\n';
  } else if (accept.indexOf('text/n3') !== -1) {
    res.header('Content-Type', 'text/n3; charset=utf-8');        
    message = '{\n' +
        '  ?photo a foaf:Image.\n' +
        '  } => {\n' +
        '  _:request http:methodName "POST";\n' +
        '    http:requestURI "/photos";\n' +
        '    http:body [ tmpl:formData ("photo=" ?photo) ];\n' +
        '    http:resp [ tmpl:location ("/photos/" ?photoId) ].\n' +
        '  ?photo :photoId _:photoId. }.\n' +    
        '}\n';
  }
  res.send(message);
}

function getPhoto(req, res, next) {
  var path = /^\/photos\/(\d+)$/;
  var pathname = require('url').parse(req.url).pathname;
  var id = pathname.replace(path, '$1');
  var accept = req.header('Accept', '*/*');
  console.log('Accept: ' + accept);
  if ((accept.indexOf('image/jpeg') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
    var location = '/photos/' + id + '/faces';
    var fileName = __dirname + '/photos/' + id + '.jpg';
    respondWithFile(res, fileName, 'image/jpeg', {
      'Link': '<' + location + '>; rel="http://restdesc.no.de/ontology#faces"; title="contained faces"; type="text/n3"'
    });
  }
  else
    res.send('', 406);
}

function optionsPhoto(req, res, next) {
  var path = /^\/photos\/(\d+)$/;
  var pathname = require('url').parse(req.url).pathname;
  var id = pathname.replace(path, '$1');
  var accept = req.header('Accept', '*/*');
  res.header('Allow', 'GET, OPTIONS, POST');
  console.log('Accept: ' + accept);
  if ((accept.indexOf('image/jpeg') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
    var location = '/photos/' + id + '/faces';
    res.header('Link', '<' + location + '>; rel="http://restdesc.no.de/ontology#faces"; title="contained faces"; type="text/n3"');
  }
  res.send('');
}

function postPhoto(req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {    
    //res.write('received upload:\n\n');
    //res.end(sys.inspect({fields: fields, files: files}));
    var file = files.photo && files.photo.name;
    var id;
    if (file) {
      if (file === 'obama-gillard.jpg') {
        id = 1;
      } else if (file === 'obama-kenny.jpg') {
        id = 2;
      } else if (file === 'obama-rousseff.jpg') {
        id = 3;
      } else {
        return res.send('', 412);
      }
      console.log('Photo ID ' + id);
      var location = '/photos/' + id;
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
  var path = /^\/photos\/(\d+)\/faces$/;
  var pathname = require('url').parse(req.url).pathname;
  var id = pathname.replace(path, '$1');
  var accept = req.header('Accept', '*/*');
  if ((accept.indexOf('text/n3') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
    var relatedCount = {'1': 2, '2': 4, '3': 6}[id] || 0;
    var linkHeaders = '';
    for(var faceId = 1; faceId <= relatedCount; faceId++) {
      var location1 = '/photos/' + id + '/faces/' + faceId;
      var personId = faceId;
      var location2 = '/photos/' + id + '/persons/' + personId;

      linkHeaders += (faceId > 1 ? ',\n      ' : '') + '<' + location1 +
          '>; rel="related"; title="contained face"; type="image/jpeg"' +
          ',\n      <' + location2 +
          '>; rel="related"; title="contained face"; type="text/plain"';
    }
    var fileName= __dirname + '/photos/' + id + '.n3';
    respondWithFile(res, fileName, 'text/n3', {
      'Link': linkHeaders
    });
  }
  else
    res.send('', 406);
}

function getFace(req, res, next) {
  var path = /^\/photos\/(\d+)\/faces\/(\d+)$/;
  var pathname = require('url').parse(req.url).pathname;
  var fileName = __dirname + pathname.replace(path, '/photos/$1_$2.jpg');
  var accept = req.header('Accept', '*/*');
  if ((accept.indexOf('image/jpeg') !== -1) ||
      (accept.indexOf('*/*') !== -1))
    respondWithFile(res, fileName, 'image/jpeg');
  else
    res.send('', 406);
}

function getPerson(req, res, next) {
  var path = /^\/photos\/(\d+)\/persons\/(\d+)$/;
  var pathname = require('url').parse(req.url).pathname;
  var fileName = __dirname + pathname.replace(path, '/photos/$1_$2');
  var accept = req.header('Accept', '*/*');
  if((accept.indexOf('text/n3') !== -1))
    respondWithFile(res, fileName + '.n3', 'text/n3');
  else if ((accept.indexOf('text/plain') !== -1) ||
           (accept.indexOf('*/*') !== -1))
    respondWithFile(res, fileName + '.txt', 'text/plain');
  else
    res.send('', 406);
}

function respondWithFile(res, fileName, contentType, headers) {
  fs.readFile(fileName, function (err, data) {
    if (err) {
      if(err.code == 'ENOENT') {
        res.send('', 404);
        return false;
      }
      res.send(500);
      throw err;
    }
    res.header('Content-Type', contentType);
    if(headers)
      for(name in headers)
        res.header(name, headers[name]);
    res.send(data);
    return true;
  });
}
