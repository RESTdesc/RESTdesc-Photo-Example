var formidable = require('formidable'),
    express = require('express'),
    url = require('url'),
    respond = require('./server-util.js').respond,
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

app.get(/^\/photos\/(\d+)\/faces$/, getFaces);

app.get(/^\/photos\/(\d+)\/faces\/(\d+)$/, getFace);

app.get(/^\/photos\/(\d+)\/persons\/(\d+)$/, getPerson);

app.start = function(port, host) {
  port = port || 8001;
  host = host || '127.0.0.1';
  this.listen(port);
  console.log('node.JS running on http://' + host + ':' + port);
}

function getBase(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  respond.withTemplate(req, res, 'base');
}

function optionsBase(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  res.header('Allow', 'GET, OPTIONS, HEAD');
  res.send(message, 200);  
}

function getPhotos(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  respond.withTemplate(req, res, 'photos', { photos: photos.all() });
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
  respond.withFile(res, photo.fileName, 'image/jpeg', {
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
  formidable.IncomingForm().parse(req, function(err, fields, files) {
    if (!(files.photo && files.photo.name))
      return next();
    var photo = photos.create(files.photo.name);
    res.header('Location', photo.url);
    respond.withTemplate(req, res, 'photo-post', { photo: photo }, 201); 
  });
}

function getFaces(req, res, next) {
  var photo = photos.get(req.params[0]),
      linkHeaders = photo.faces.map(function (face) {
    return '<' + face.url + '>; rel="related"; title="contained face"; type="image/jpeg"'
       + ', <' + face.personUrl +'>; rel="related"; title="depicted person"; type="text/n3"';
  });
  respond.withFile(res, photo.faces.fileName, 'text/n3', { 'Link': linkHeaders.join() });
}

function getFace(req, res, next) {
  var face = photos.get(req.params[0]).faces.get(req.params[1]);
  respond.withFile(res, face.fileName, 'image/jpeg');
}

function getPerson(req, res, next) {
  var face = photos.get(req.params[0]).faces.get(req.params[1]);
  respond.withFile(res, face.personFileName, 'text/plain');
}
