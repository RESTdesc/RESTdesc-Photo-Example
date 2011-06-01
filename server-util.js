var fs = require('fs'),
    path = require('path'),
    ejs = require('ejs');

var respond = exports.respond = {};

respond.withText = function (res, text, contentType) {
  res.header('Content-Type', contentType);
  res.send(text);
}

respond.withFile = function (res, fileName, contentType, headers) {
  fs.readFile(fileName, function (err, data) {
    if (err) {
      if(err.code == 'ENOENT') {
        return res.send('', 404);
      }
      throw err;
    }
    res.header('Content-Type', contentType);
    if(headers)
      for(name in headers)
        res.header(name, headers[name]);
    res.send(data);
  });
};

respond.withTemplate = function (req, res, template, locals, statusCode) {
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
          res.send(result, statusCode);
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
};
