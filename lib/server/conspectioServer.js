module.exports = (http) => {
  const io = require ('socket.io')(http);
  const ConspectioNode = require('./conspectioNode.js');
  const alasql = require('alasql');
  // custom function that returns array length
  alasql.fn.arrlen = function(arr) { return arr.length; };

  //create nodeTracker table
  alasql('CREATE TABLE nodeTracker');
  //max number of leechers per broadcast relayer
  const maxRelayers = 1;
  io.on('connection', (socket) => {
  
    console.log('socket connected', socket.id);

    // NOTE: assume just 1 broadcaster per event id for now
    //listens for event tag from broadcaster
    socket.on('addBroadcaster', (eventId) => {
      // add a new broadcaster asssociated with that event id
      var newBroadcaster = new ConspectioNode(socket.id, eventId);
      alasql('INSERT INTO nodeTracker VALUES ?', [newBroadcaster]);

      // if there's already a broadcaster for this eventId, need to inform all viewers and their leechers (DFS recursive notifications) of new broadcaster
        //each leecher needs a new node where the origin is this new broadcaster
        //emit msg to client-side which is this new broadcaster to create a connections obj. to all leechers



      // for(var viewer in eventTracker[eventTag].viewers) {
      //     io.to(socket.id).emit('initiateConnection', viewer);
      // }
      console.log('inside addBroadcaster nodeTracker ', alasql('SELECT * FROM nodeTracker'));
    });

    //TODO! Refactor
    // //listens for broadcaster when they stop streaming
    // socket.on('removeBroadcaster', (eventTag) => {
    //   delete eventTracker[eventTag].broadcasters[socket.id];
      
    //   if(!Object.keys(eventTracker[eventTag].broadcasters).length) {

    //     // inform viewer that there are no more broadcasters, but let developer decide where to go
    //     // var destination = './events.html';
    //     for (var viewer in eventTracker[eventTag].viewers) {
    //       io.to(viewer).emit('noMoreBroadcasters'); 
    //       // io.to(viewer).emit('redirectToEvents', destination); 
    //     }
    
    //     delete eventTracker[eventTag];
      
    //   } else {
    //     //inform viewer which broadcaster left so that viewer can look up the corresponding peer connection object, remove track, close it, remove from connections object, remove video tag
    //     //add broadcasterid to video tag upon creation
    //     for (var viewer in eventTracker[eventTag].viewers) {
    //       io.to(viewer).emit('broadcasterLeft', socket.id); 
    //     }
    //   }
    //   console.log('eventTracker',eventTracker);
    // });

    //listens for eventList request from viewer
    socket.on('getEventList', () => {
      // query nodeTracker for a list of all active unique events
      var events = alasql('SELECT DISTINCT eventId from nodeTracker');;

      // use map to extract the eventId from events results
      var eventsList = events.map((eventObj) => {
        return eventObj.eventId;
      });
      
      // emits list of events to ConspectioManager
      socket.emit('sendEventList', eventsList);
    });

    // listens for initiate view request from viewer
    socket.on('initiateView', (eventId) => {

      // check #1: find broadcaster(s) for this eventId - we need this as the origin socketId// LIMIT 3
      var broadcastersList = alasql('SELECT socketId FROM nodeTracker WHERE eventId=? AND origin="" LIMIT 2', [eventId]); 

      // grab array of broadcasters' socketIds
      var broadcasterIds = broadcastersList.map((socketIdObj) => {
        return socketIdObj.socketId;
      });
      broadcasterIds.forEach((broadcasterId) => {
        var sourcesToCheck = [broadcasterId];
        var foundCapacity = false;
        
        while(!foundCapacity){
          //**Store broadcaster node with the min amout of leechers
            //TODO: add check for origin
            console.log('SOURCESTOCHECK:', sourcesToCheck);
          var broadcasterNode = alasql('SELECT * FROM nodeTracker WHERE arrlen(leechers) < ? AND socketId IN @(?) ORDER BY arrlen(leechers) LIMIT 1', [maxRelayers, sourcesToCheck])[0];
          console.log('broadcasterNODE with capacity:', broadcasterNode);
            // if there is capacity, connect newViewer to this broadcaster - take the broadcaster's socketId and make it newViewer's source and origin
          if(broadcasterNode) {
            // check #2: determine broadcasterid with min amount of leechers
            var broadcasterIdWithCapacity = broadcasterNode.socketId;
            foundCapacity = true;
            // make a new Node for this viewer
            var newViewer = new ConspectioNode(socket.id, eventId);
            //update source of newViewer
            newViewer.source = broadcasterIdWithCapacity;
            //update degree of newViewer //query broadcasterId's degree
            newViewer.degree = broadcasterNode.degree + 1;
            //update origin
            if(broadcasterNode.origin === ''){
              newViewer.origin = broadcasterIdWithCapacity;
            } else {
              newViewer.origin = broadcasterNode.origin;
            }
            console.log('NEW VIEWER', newViewer);
            //finally, insert viewer node into table
            alasql('INSERT INTO nodeTracker VALUES ?', [newViewer]);
            
            // take the newViewer socketId and add it to the broadcaster's leecher's array
            broadcasterNode.leechers.push(socket.id);

            //check broadcaster origin and to decide who to connect to
            if(broadcasterNode.origin === ''){
              io.to(broadcasterIdWithCapacity).emit('initiateConnection', socket.id);
            } else {
              io.to(broadcasterIdWithCapacity).emit('initiateRelay', socket.id, broadcasterNode.origin); 
            }
          } else {
            //every relayer in sourcesToCheck is at capacity. get their leechers array and check those for capacity next with another iteration in the while loop
            
            //get an array of leechers for 1 relayer
            function getLeechers(socketId){
              return alasql('SELECT leechers FROM nodeTracker WHERE socketId=?',[socketId]);
            }
            var result = [];
            var newRelayersToCheck = sourcesToCheck.map((relayerId)=>{
              result.push(getLeechers(relayerId)[0].leechers);
            });
            sourcesToCheck = flattenDeep(result);
          }
        } //end while loop
      }) //end of forEach
    });

    socket.on('signal', (toId, message) => {
      console.log('inside signal', toId);
      // send the peerObj to the peerId
      io.to(toId).emit('signal', socket.id, message);
    });

    //listens for disconnection
    //TODO: clean up connections object of any rtc connections that were prev. connected to the dropped relayer.
    // socket.on('disconnect', () => {


    //CASE 1: Viewer has no leechers and disconnects
    //remove viewer node from nodeTracker
    //anyone that has this viewer's socketid (in the dropped viewer's source) in their leechers array, remove this viewerid from the array
      // client side notification - emit message to broadcaster/relay that viewer left to clean up conspectio.connections{}
 
    //CASE 4: Broadcaster disconnects with NO leechers
    //remove broadcaster node from nodeTracker
    
    //CASE 3: Broadcaster disconnects with leechers
    //remove broadcaster node from nodeTracker
    //for all leechers in the broadcaster's leechers array
      //recursively trace through the leechers and remove reference (delete leechers' nodes from the end to beginning) to this broadcaster
      // client side notification - emit message to leechers that broadcaster left to clean up conspectio.connections{}

    //CASE 2: Viewer has leechers and disconnects (Viewer is a Relay Broadcaster)
    //find viewer's source and update their leechers array
    //for all leechers in the relayBroadcaster's leechers array
      //recursively trace through the leechers and find new source (broadcaster or relayBroadcaster), update degree of leechers
      // client side notification - emit message to leechers that viewer (relayBroadcaster in the eyes of leechers) left to clean up conspectio.connections{}
    //remove viewer node from nodeTracker
    // client side notification - emit message to broadcaster/relay broadcaster that viewer left to clean up conspectio.connections{}



      // console.log('this user left:', socket.id, 'socket:');
      // for (var key in eventTracker){
        
      //   if (eventTracker[key].broadcasters[socket.id]) {
      //     console.log('broadcaster disconnected. eventTracker in for loop:', eventTracker);
      //     var eventTag = key;
      //     console.log('eventTag:', key);
      //     delete eventTracker[eventTag].broadcasters[socket.id];
      //     console.log('eventTracker[eventTag]', eventTracker[eventTag]);
      //     if(Object.keys(eventTracker[eventTag].broadcasters).length === 0){
            
      //       console.log('no more broadcasters for this event');
      //       if (Object.keys(eventTracker[eventTag].viewers).length){
      //         for (var viewer in eventTracker[eventTag].viewers){
      //           //redirect viewers to events.html
      //           var destination = './events.html';
      //           io.to(viewer).emit('redirectToEvents', destination);
      //           delete eventTracker[eventTag];
      //         }
      //       }
            
      //     }
      //   } 
      //   else if (eventTracker[key].viewers[socket.id]){
      //     var currEvent = key;
      //     delete eventTracker[key].viewers[socket.id];
      //     console.log('viewer left. event: ',eventTracker[key]);
      //     console.log('EVENTTRACKER', eventTracker[currEvent].broadcasters)
      //     if(Object.keys(eventTracker[currEvent].broadcasters).length) {
      //       var broadcasterSocketIdArr = Object.keys(eventTracker[currEvent].broadcasters);
      //       var broadcasterId = eventTracker[currEvent].broadcasters[broadcasterSocketIdArr[0]];
      //       console.log('broadcasterId after viewer leaving', broadcasterId);
      //       if(Object.keys(eventTracker[currEvent].viewers).length) {
      //         var viewerSocketIdArr = Object.keys(eventTracker[currEvent].viewers);
      //         var viewerId = eventTracker[currEvent].viewers[viewerSocketIdArr[0]];
      //         console.log('viewerId after viewer leaving', viewerId);
      //         io.to(broadcasterId).emit('initiateConnection', viewerId);
      //       }
      //     }
      //   }
      // }
    // });
  }); //end socket connection

}

//helper function flattens an array to one level
function flattenDeep(array) {
  function recurse(array, finalArr){
    for (var i = 0; i < array.length; i++) {			
      if (array[i].constructor !== Array) {			
        finalArr.push(array[i]);
      } else {
        recurse(array[i], finalArr);			
      }
    }
    return finalArr;
  }
  return recurse(array, []);
}