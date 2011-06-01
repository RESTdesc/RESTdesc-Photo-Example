var Steps = require('cucumis').Steps,
    stepsData = require('./steps_data').data;

Steps.Then(/^I should receive a list of (\d+) faces$/, function (ctx, count) {
  for(var i=1; i<=count; i++)
    stepsData.responseBody.should.match(
      new RegExp('</photos/.*> :regionId ' + i + ';'));
	ctx.done();
});

Steps.export(module);
