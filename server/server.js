const express = require('express');
const app = express();
const http = require ('http').Server(app);
const io = require ('socket.io')(http);
const path = require('path');

app.get('/', (req,res) => {
	res.sendFile(path.resolve('client/index.html'));
	
});

app.use(express.static('client'));

var eventTracker = {};

io.on('connection', (socket) => {
  //echo test
  socket.emit('echo', 'server side socket!');
  
  console.log('socket connected', socket.id);

  //listens for event tag from broadcaster
  socket.on('sendEventTag', (eventTag) => {

    if(!eventTracker[eventTag]) {
      eventTracker[eventTag] = {
        broadcasters: {}, 
        viewers: {}  
      };

      eventTracker[eventTag].broadcasters[socket.id] = socket; // save ref to this socket obj
    } else {
      eventTracker[eventTag].broadcasters[socket.id] = socket; // save ref to this socket obj
    } 
    console.log('eventTracker:', eventTracker);
  })




  //listens for broadcaster when they stop streaming
  socket.on('removeBroadcaster', (eventTag) => {
    delete eventTracker[eventTag].broadcasters[socket.id];
    if(!Object.keys(eventTracker[eventTag].broadcasters).length) {
      //need to handle viewer side (redirect viewers back to event page)
      delete eventTracker[eventTag];
    }
    console.log('eventTracker',eventTracker);
  });

  //listens for eventList request from viewer
  socket.on('getEventList', () => {
    socket.emit('sendEventList', Object.keys(eventTracker));
  });

  // listens for initiate view request from viewer
  socket.on('initiateView', (eventTag) => {
    // add this viewer socket to eventTracker
    eventTracker[eventTag].viewers[socket.id] = socket; // save ref to this socket obj
    console.log('inside initiateView', eventTracker);

    // send message to broadcaster that a viewer wants to connected
    var broadcasterSocketId = Object.keys(eventTracker[eventTag].broadcasters)[0]; // for now, pick the 1st broadcaster for this eventTag
    console.log('broadcasterSocketId', broadcasterSocketId);

    // emit a message to broadcaster to initiate connection
    io.to(broadcasterSocketId).emit('initiateConnection', socket.id);

  });

  socket.on('signal', (toId, message) => {
    console.log('inside signal', toId);
    // send the peerObj to the peerId
    io.to(toId).emit('signal', socket.id, message);
  });

  // socket.on('signal', (toId, peerObj) => {
  //   console.log('inside signal', toId);
  //   // send the peerObj to the peerId
  //   io.to(toId).emit('signal', peerObj);
  // });

  //listen for broadcastURL from broadcaster
  // socket.on('storeBroadcastURL', (broadcastURL, eventTag) => {
  //   eventTracker[eventTag].broadcasters[socket.id] = broadcastURL;
  //   console.log('eventTracker', eventTracker);
  // });

  // socket.on('getBroadcastURL', (eventTag) => {

  //   var broadcastURLKey = Object.keys(eventTracker[eventTag].broadcasters)[0];
  //   var broadcastURL = eventTracker[eventTag].broadcasters[broadcastURLKey];
  //   console.log('broadcastURL', broadcastURL);
  //   socket.emit('sendBroadcastURL', broadcastURL);
  // });
});




http.listen(3000, function(){
	console.log('listening on 3000');
});

module.export = http;