var Steps = require('cucumis').Steps,
    assert  = require('assert'),
    stepsData = require('./steps_data').data,
    path = require('path'),
    fs = require('fs');

Steps.Given(/^I have a photo with ID (\d+)$/, function (ctx, id) {
  path.exists('photos/' + id + '.jpg', function (exists) {
    exists.should.be.ok;
    ctx.done();
  })
});

Steps.Then(/^I should receive photo (\d+)$/, function (ctx, id) {
	fs.stat('photos/' + id + '.jpg', function(err, stat) {
	  // just compare file size for now
	  stepsData.responseLength.should.eql(stat.size);
    ctx.done();
  });
});

Steps.export(module);
