var formidable = require('formidable'),
    express = require('express'),
    fs = require('fs'),
    path = require('path'),
    ejs = require('ejs'),
    url = require('url'),
    querystring = require('querystring'),
    photos = require('./photo-library.js').Photos;

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

app.get(/^\/photos\/(\d+)$/, getPhoto);
app.options(/^\/photos\/(\d+)$/, optionsPhoto);

app.get(/^\/photos\/\d+\/faces$/, getFaces);

app.get(/^\/photos\/\d+\/faces\/\d+$/, getFace);

app.get(/^\/photos\/\d+\/persons\/\d+$/, getPerson);

app.start = function(port, host) {
  port = port || 8001;
  host = host || '127.0.0.1';
  this.listen(port);
  console.log('node.JS running on http://' + host + ':' + port);
}

function getBase(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  respondWithTemplate(req, res, 'base');
}

function optionsBase(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  res.header('Allow', 'GET, OPTIONS, HEAD');
  res.send(message, 200);  
}

function getPhotos(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  respondWithTemplate(req, res, 'photos', { photos: photos.all() });
}

function optionsPhotos(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  res.header('Allow', 'GET, OPTIONS, POST');
  var accept = req.header('Accept', '*/*');
  var message;
  if ((accept.indexOf('text/n3') !== -1) ||
      (accept.indexOf('*/*') !== -1)) {
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
  var photo = photos.get(req.params[0]);
  respondWithFile(res, photo.fileName, 'image/jpeg', {
    'Link': '<' + photo.faces.url + '>; rel="http://restdesc.no.de/ontology#faces"; title="contained faces"; type="text/n3"'
  });
}

function optionsPhoto(req, res, next) {
  var path = /^\/photos\/(\d+)$/;
  var pathname = url.parse(req.url).pathname;
  var id = pathname.replace(path, '$1');
  var accept = req.header('Accept', '*/*');
  res.header('Allow', 'GET, OPTIONS, POST');
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
  var pathname = url.parse(req.url).pathname;
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

      linkHeaders += (faceId > 1 ? ',     ' : '') + '<' + location1 +
          '>; rel="related"; title="contained face"; type="image/jpeg"' +
          ', <' + location2 +
          '>; rel="related"; title="depicted person"; type="text/n3"';
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
  var pathname = url.parse(req.url).pathname;
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
  var pathname = url.parse(req.url).pathname;
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

function respondWithTemplate(req, res, template, locals) {
  var accepts = req.header('Accept', '*/*').split(',');
  function tryToRespond() {
    var accept = accepts.shift(),
        format = (accept == '*/*' ? 'text/html' : accept),
        extension = format.split('/')[1],
        templateFile = 'templates/' + template + '.' + extension + '.ejs';
    path.exists(templateFile, function (exists) {
      if(exists) {
        fs.readFile(templateFile, 'utf-8', function (err, data) {
          var result = ejs.render(data, { locals: locals || {} });
          res.header('Content-Type', format + '; charset=utf-8')
          res.send(result);
        });
      }
      else {
        if (accepts.length)
          tryToRespond();
        else
          res.send('', 406);
      }
    });
  };
  tryToRespond();
}
