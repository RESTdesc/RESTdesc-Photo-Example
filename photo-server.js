/***
          PHOTO SERVER
          a RESTdesc sample implementation
***/


var formidable = require('formidable'),
    express = require('express'),
    url = require('url'),
    fs = require('fs'),
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
app.options(/^\/([\d\w\/]+)$/, getDescription);


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

function getDescription(req, res, next) {
  var uriPattern = new RegExp(req.params[0].replace(/\//g, '-')
                                           .replace(/\d+/g, 'id') + '.*');
  fs.readdir('descriptions', function (err, fileNames) {
    if(err) throw err;
    fileNames = fileNames.filter(function (file) { return file.match(uriPattern); })
                         .sort(function (a,b) { return b.length - a.length; });
    if(!fileNames.length)
      return res.send(404);
    
    readFiles('descriptions', fileNames, function (files) {
      res.header('Allow', 'GET,HEAD,POST,OPTIONS');
      respond.withText(res, joinN3Documents(files), 'text/n3');
    });
  });
}


/***    helpers    ***/

function readFiles(directory, fileNames, callback) {
  var files = [];
  fileNames.forEach(function (fileName) {
    fs.readFile(directory + '/' + fileName, 'utf-8', function (err, data) {
      files.push(data);
      if(files.length == fileNames.length)
        callback(files);
    });
  });
}

function joinN3Documents(documents) {
  var namespaces = '', usedNamespaces = {}, triples = '',
      match, prefixMatcher = /^@prefix.*\.$\n/gm;
  documents.forEach(function (document) {
    while((match = prefixMatcher.exec(document)) && (match = match[0]))
      if(!usedNamespaces[match])
        namespaces += (usedNamespaces[match] = match);
    triples += document.replace(prefixMatcher, '');
  });
  return namespaces + triples;
}
