var fs = require('fs');

var photos;

function Photo(id) {
  this.id = id;
  
  Object.defineProperties(this, {
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
  }
};
