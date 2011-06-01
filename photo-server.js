/***
          PHOTO SERVER
          a RESTdesc sample implementation
***/


var formidable = require('formidable'),
    express = require('express'),
    url = require('url'),
    respond = require('./server-util.js').respond,
    querystring = require('querystring'),
    photos = require('./photo-library.js').Photos;


/***    exports    ***/

var app = exports.server = express.createServer();

app.start = function(port, host) {
  port = port || 8001;
  host = host || '127.0.0.1';
  this.listen(port);
  console.log('node.JS running on http://' + host + ':' + port);
}


/***    configuration    ***/

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


/***    routing    ***/

app.get(/^\/$/, getBase);
app.get(/^\/photos$/, getPhotos);
app.post(/^\/photos$/, postPhoto);
app.get(/^\/photos\/(\d+)$/, getPhoto);
app.get(/^\/photos\/(\d+)\/faces$/, getFaces);
app.get(/^\/photos\/(\d+)\/faces\/(\d+)$/, getFace);
app.get(/^\/photos\/(\d+)\/persons\/(\d+)$/, getPerson);


/***    handlers    ***/

function getBase(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  respond.withTemplate(req, res, 'base');
}

function getPhotos(req, res, next) {
  res.header('Link', '</photos>; rel="index"');
  respond.withTemplate(req, res, 'photos', { photos: photos.all() });
}

function getPhoto(req, res, next) {
  var photo = photos.get(req.params[0]);
  respond.withFile(res, photo.fileName, 'image/jpeg', {
    'Link': '<' + photo.faces.url + '>; rel="http://restdesc.no.de/ontology#faces"; title="contained faces"; type="text/n3"'
  });
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
