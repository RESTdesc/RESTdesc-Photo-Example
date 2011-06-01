var Steps = require('cucumis').Steps,
    stepsData = require('./steps_data').data,
    fs = require('fs');

Steps.Then(/^I should receive a list of (\d+) faces$/, function (ctx, count) {
  for(var i=1; i<=count; i++)
    stepsData.responseBody.should.match(
      new RegExp('</photos/.*> :regionId ' + i + ';'));
	ctx.done();
});

Steps.Then(/^I should receive face (\d+) of photo (\d+)$/, function (ctx, faceId, photoId) {
	fs.stat('photos/' + photoId + '_' + faceId + '.jpg', function(err, stat) {
	  // just compare file size for now
	  stepsData.responseLength.should.eql(stat.size);
    ctx.done();
  });
});

Steps.export(module);
