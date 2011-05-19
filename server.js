var server = require('./photo-server').server
server.start(process.env.PORT, process.env.HOST);
