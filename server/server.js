var express = require('express');
var app = express();
var http = require ('http').Server(app);
var io = require ('socket.io')(http);
var path = require('path');

app.get('/', function(req,res){
	res.sendFile(path.resolve('client/index.html'));
	
});

app.use(express.static('client'));

io.on('connection', function(socket){
  console.log('socket connected', socket.id);
});


http.listen(3000, function(){
	console.log('listening on 3000');
});