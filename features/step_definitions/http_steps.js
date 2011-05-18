var Steps = require('cucumis').Steps,
    server = require('../../server').server,
    http    = require('http'),
    assert  = require('assert'),
    stepsData = require('./steps_data').data;
    
var port = 8200,
    host = '127.0.0.1',
    client = http.createClient(port, host),
    response;

Steps.Runner.on('beforeTest', function(done) {
	server.start(port, host);
	done();
});

Steps.Runner.on('afterTest', function(done) {
	server.close();
	done();
});

Steps.When(/^I GET (\/.*)$/, function (ctx, path) {
  var request = client.request('GET', path)
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
  response.headers['content-type'].should.eql(mimeType);
	ctx.done();
});

Steps.export(module);
