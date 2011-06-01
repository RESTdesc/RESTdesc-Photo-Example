var fs = require('fs');

var photos;

function Photo(id) {
  Object.defineProperties(this, {
    id: { value: id },
    fileName: { value: 'photos/' + id + '.jpg' },
    url: { value: '/photos/' + id },
    faces: { value: new Faces(this) }
  });
}

function Face(photo, id) {
  Object.defineProperties(this, {
    id: { value: id },
    fileName: { get: function() { return 'photos/' + photo.id + '_' + id + '.jpg'; } },
    url: { get: function() { return photo.url + '/faces/' + id; } },
    personUrl: { get: function() { return photo.url + '/persons/' + id; } }
  });
}

function Faces(photo) {
  var faces, faceCount = 0;
  
  Object.defineProperties(this, {
    fileName: { get: function() { return 'photos/' + photo.id + '.n3'; } },
    length: { get: function() { this.all(); return faceCount; } },
    url: { get: function() { return photo.url + '/faces'; } }
  });
  
  this.all = function () {
    if(!faces) {
      faces = {};
      var files = fs.readdirSync('photos'), result, id;
      files.forEach(function (file) {
        if((result = /^(\d+)_(\d+)\.jpg$/.exec(file)) && (result[1] == photo.id)) {
          faces[id = result[2]] = new Face(photo, id);
          faceCount++;
        }
      });
    }
    return faces;
  };
  
  this.map = function (callback) {
    var result = [];
    for(var id in this.all())
      result.push(callback(faces[id]));
    return result;
  };
  
  this.get = function (id) {
    return this.all()[id];
  };
}

exports.Photos = {
  all: function () {
    if(!photos) {
      photos = {};
      var files = fs.readdirSync('photos'), result, id;
      files.forEach(function (file) {
        if(result = /^(\d+)\.jpg$/.exec(file))
          photos[id = result[1]] = new Photo(id);
      });
    }
    return photos;
  },
  
  get: function (id) {
    return this.all()[id];
  },
  
  create: function (name) {
    var id = { 'obama-gillard.jpg':  1,
               'obama-kenny.jpg':    2,
               'obama-rousseff.jpg': 3 }[name];
    if(!id)
      throw new Error('This example implementation only supports the sample photographs.');
    return this.get(id);
  }
};
