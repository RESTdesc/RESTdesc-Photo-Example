var Steps = require('cucumis').Steps,
    server = require('../../server').server,
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    assert  = require('assert'),
    stepsData = require('./steps_data').data;
    
var port = 8200,
    host = '127.0.0.1',
    linkTypes = {},
    client = http.createClient(port, host),
    response;

Steps.Runner.on('beforeTest', function(done) {
	server.start(port, host);
	var linkTypesFile = 'features/step_definitions/link_types.json';
	if(path.exists(linkTypesFile, function(exists) {
	  if(exists)
  	  fs.readFile(linkTypesFile, 'utf8', function(err, data) {
  	      linkTypes = JSON.parse(data);
  	      done();
  	  });
  	else
  	  done();
	}));
});

Steps.Runner.on('afterTest', function(done) {
	server.close();
	done();
});

Steps.When(/^I (GET|HEAD|OPTIONS) (\/.*)$/, function (ctx, method, path) {
  var request = client.request(method, path)
  request.end();
  request.on('response', function (resp) {
    var receivedLength = 0,
        responseLength = stepsData.responseLength = parseInt(resp.headers['content-length']),
        responseBodyBuffer = stepsData.responseBodyBuffer = new Buffer(responseLength);
    stepsData.response = response = resp;
    
    response.on('data', function(chunk) {
      chunk.copy(responseBodyBuffer, receivedLength, 0);
      receivedLength += chunk.length;
    });
    response.on('end', function() {
      stepsData.responseBody = responseBodyBuffer.toString('utf8');
      ctx.done();
    })
  });
});

Steps.Then(/^it should have MIME type (.*)$/, function (ctx, mimeType) {
  response.headers.should.include.keys('content-type');
  response.headers['content-type'].should.eql(mimeType);
	ctx.done();
});

Steps.Then(/^I should receive a (.+) link to (\/.*)$/, function (ctx, linkName, path) {
  linkTypes.should.include.keys(linkName);
  var linkType = linkTypes[linkName];
  
  response.headers.should.include.keys('link');
  var linkHeader = response.headers['link'];
  
  var reLink = '^<' + RegExp.escape(path) + '>;\\s*rel="' + linkType.rel
                 + '";\\s*title="' + linkType.title
                 + '";\\s*type="' + linkType.type + '"$';
  
  linkHeader.should.match(new RegExp(reLink));
  ctx.done();
});

Steps.export(module);
