var Steps = require('cucumis').Steps,
    assert  = require('assert'),
    stepsData = require('./steps_data').data,
    path = require('path'),
    fs = require('fs');

Steps.Given(/^the server has a photo with ID (\d+)$/, function (ctx, id) {
  path.exists('photos/' + id + '.jpg', function (exists) {
    exists.should.be.ok;
    ctx.done();
  });
});

Steps.Given(/^there are (\d+) photos on the server$/, function (ctx, count) {
  var found = 0;
	for(var i=1; i<=count; i++)
	  path.exists('photos/' + i + '.jpg', function (exists) {
	    exists.should.be.ok;
	    found++;
	    if(found==count)
	      ctx.done();
	  });
});

Steps.Then(/^I should receive photo (\d+)$/, function (ctx, id) {
	fs.stat('photos/' + id + '.jpg', function(err, stat) {
	  // just compare file size for now
	  stepsData.responseLength.should.eql(stat.size);
    ctx.done();
  });
});

Steps.Then(/^I should receive a list of (\d+) photos$/, function (ctx, count) {
  for(var i=1; i<=count; i++)
    stepsData.responseBody.should.match(
      new RegExp('<a href="/photos/' + i + '" rel="http://xmlns.com/foaf/0.1/Image">/photos/' + i + '</a>'));
	ctx.done();
});

Steps.Then(/^I should receive an N3 list of (\d+) photos$/, function (ctx, count) {
  for(var i=1; i<=count; i++)
    stepsData.responseBody.should.match(
      new RegExp('</photos/' + i + '>'));
	ctx.done();
});

Steps.export(module);
