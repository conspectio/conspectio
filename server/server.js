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

// ***UX#1: 
// var viewersDeciding = {};

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

      eventTracker[eventTag].broadcasters[socket.id] = socket.id;
      console.log('eventtracker:', eventTracker);
      // ***UX#1: updateViewersOnEventsPage();
      
    } else {
      eventTracker[eventTag].broadcasters[socket.id] = socket.id;
      for(var viewer in eventTracker[eventTag].viewers) {
        io.to(socket.id).emit('initiateConnection', viewer);
      }
    } 
    // console.log('eventTracker:', eventTracker);
  })

  // ***UX#1: 
   //emit event to all viewers currently on events.html a new event has been created and to update event list
  // updateViewersOnEventsPage = ()=>{
  //   console.log('inside updateViewersOnEventsPage');
  //   for (var viewer in viewersDeciding) {
  //     io.to(viewer).emit('newEventAdded', Object.keys(eventTracker));
  //   }
  // }    

  // ***UX#1: 
  // socket.on('getEventList', (viewersDecidingObj) => {
  //   console.log('server geteventlist viewersDeciding:', viewersDeciding);
  //   viewersDeciding = viewersDecidingObj;

  // })
  //listens for broadcaster when they stop streaming
  socket.on('removeBroadcaster', (eventTag) => {
    console.log('removebroadcasterListener. eventtracker:', eventTracker);
    delete eventTracker[eventTag].broadcasters[socket.id];
    
    if(!Object.keys(eventTracker[eventTag].broadcasters).length) {

      var destination = './events.html';
      for (var viewer in eventTracker[eventTag].viewers) {

        io.to(viewer).emit('redirectToEvents', destination); 
      }
   
      delete eventTracker[eventTag];
     
    } else {
      //inform viewer which broadcaster left so that viewer can look up the corresponding peer connection object, remove track, close it, remove from connections object, remove video tag
      //add broadcasterid to video tag upon creation
      for (var viewer in eventTracker[eventTag].viewers) {
        io.to(viewer).emit('broadcasterLeft', socket.id); 
      }
    }
    console.log('eventTracker',eventTracker);
  });

  //listens for eventList request from viewer
  socket.on('getEventList', () => {
    for (var event in eventTracker){
      if (!Object.keys(eventTracker[event].broadcasters).length){
        delete eventTracker[event];
      }
    }
    
    socket.emit('sendEventList', Object.keys(eventTracker));
  });

  // listens for initiate view request from viewer
  socket.on('initiateView', (eventTag) => {
    // add this viewer socket to eventTracker
    if(eventTracker[eventTag]) {
      eventTracker[eventTag].viewers[socket.id] = socket.id; // save ref to this socket obj
      console.log('inside initiateView', eventTracker);

      // send message to broadcaster that a viewer wants to connect
      var broadcasterSocketIdArr = Object.keys(eventTracker[eventTag].broadcasters); // for now, pick the 1st broadcaster for this eventTag

      for(var i = 0; i < broadcasterSocketIdArr.length; i++) {
      console.log('broadcasterSocketIdArr', broadcasterSocketIdArr[i]);
        // server emits a message to broadcaster to initiate connection
        // socket.id is from viewer
        io.to(broadcasterSocketIdArr[i]).emit('initiateConnection', socket.id);
      }
    }
  });

  socket.on('signal', (toId, message) => {
    console.log('inside signal', toId);
    // send the peerObj to the peerId
    io.to(toId).emit('signal', socket.id, message);
  });

  //listens for disconnection
  socket.on('disconnect', () => {
    console.log('this user left:', socket.id, 'socket:');
    
    for (var key in eventTracker){
      
      if (eventTracker[key].broadcasters[socket.id]) {
        console.log('broadcaster disconnected. eventTracker in for loop:', eventTracker);
        var eventTag = key;
        console.log('eventTag:', key);
        delete eventTracker[eventTag].broadcasters[socket.id];
        console.log('eventTracker[eventTag]', eventTracker[eventTag]);
        if(Object.keys(eventTracker[eventTag].broadcasters).length === 0){
          
          console.log('no more broadcasters for this event');
          if (Object.keys(eventTracker[eventTag].viewers).length){
            for (var viewer in eventTracker[eventTag].viewers){
              //redirect viewers to events.html
              var destination = './events.html';
              io.to(viewer).emit('redirectToEvents', destination);
              delete eventTracker[eventTag];
            }
          }
          
        }
      } 
      else if (eventTracker[key].viewers[socket.id]){
        delete eventTracker[key].viewers[socket.id];
        console.log('viewer left. event: ',eventTracker[key]);
      }
    }
  });
});

http.listen(3001, function(){
	console.log('listening on 3001');
});

module.export = http;