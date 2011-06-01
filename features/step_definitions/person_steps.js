var Steps = require('cucumis').Steps,
    stepsData = require('./steps_data').data;

Steps.Then(/^I should receive the person (.*)$/, function (ctx, person) {
	stepsData.responseBody.should.eql(person);
  ctx.done();
});

Steps.export(module);
