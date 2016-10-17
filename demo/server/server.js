const express = require('express');
const app = express();
const http = require ('http').Server(app);
const path = require('path');

app.set('port', process.env.PORT || 3000);

// require in conspectio npm package and invoke
// const conspectioServer = require('conspectio');
// lib in progress, use the lib server conspectioServer.js
// updated require path due to demo folder
const conspectioServer = require('./../../lib/server/conspectioServer.js');
conspectioServer(http);

// currently don't have a CDN conspectio client lib, need this server to host the file
// updated require path due to demo folder
app.use(express.static(path.join(`${__dirname}/../../dist`)));

// serve up demo client side files
app.use(express.static(path.join(`${__dirname}/../client`)));

app.get('/', (req,res) => {
	res.sendFile(path.resolve('client/index.html'));
});

http.listen(app.get('port'), function(){
	console.log('listening on port:',app.get('port'));
});

module.export = http;