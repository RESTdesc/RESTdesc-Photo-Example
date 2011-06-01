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

function Faces(photo) {
  Object.defineProperties(this, {
    url: { get: function() { return photo.url + '/faces'; } }
  });
}

exports.Photos = {
  all: function () {
    if(!photos) {
      photos = {};
      var files = fs.readdirSync('photos'), result, id;
      files.forEach(function (file) {
        if(result = /^(\d+)\.jpg$/.exec(file)) {
          id = result[1];
          photos[id] = new Photo(id);
        }
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
