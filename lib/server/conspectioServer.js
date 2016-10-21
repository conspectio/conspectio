module.exports = (http) => {
  const io = require ('socket.io')(http);
  const ConspectioNode = require('./conspectioNode.js');
  const alasql = require('alasql');
  // custom function that returns array length
  alasql.fn.arrlen = function(arr) { return arr.length; };
  // create nodeTracker table instead of nodeTracker[] due to compatiability with alasql CRUD operations
  alasql('CREATE TABLE nodeTracker');
  
  var nodeTracker = [];

  io.on('connection', (socket) => {
  
    console.log('socket connected', socket.id);

    // NOTE: assume just 1 broadcaster per event id for now
    //listens for event tag from broadcaster
    socket.on('addBroadcaster', (eventId) => {
      // add a new broadcaster asssociated with that event id
      var newBroadcaster = new ConspectioNode(socket.id, eventId);
      nodeTracker.push(newBroadcaster);

      // if there's already a broadcaster for this eventId, need to inform all viewers and their leechers (DFS recursive notifications) of new broadcaster
        //each leecher needs a new node where the origin is this new broadcaster
        //emit msg to client-side which is this new broadcaster to create a connections obj. to all leechers



      // for(var viewer in eventTracker[eventTag].viewers) {
      //     io.to(socket.id).emit('initiateConnection', viewer);
      // }
      console.log('inside addBroadcaster nodeTracker ', nodeTracker);
    })

    //TODO! Refactor
    //listens for broadcaster when they stop streaming
    socket.on('removeBroadcaster', (eventTag) => {
      delete eventTracker[eventTag].broadcasters[socket.id];
      
      if(!Object.keys(eventTracker[eventTag].broadcasters).length) {

        // inform viewer that there are no more broadcasters, but let developer decide where to go
        // var destination = './events.html';
        for (var viewer in eventTracker[eventTag].viewers) {
          io.to(viewer).emit('noMoreBroadcasters'); 
          // io.to(viewer).emit('redirectToEvents', destination); 
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
      // query nodeTracker for a list of all active unique events
      var events = alasql('SELECT DISTINCT eventId FROM ?', [nodeTracker]);

      // use map to extract the eventId from events results
      var eventsList = events.map((eventObj) => {
        return eventObj.eventId;
      });
      
      // emits list of events to ConspectioManager
      socket.emit('sendEventList', eventsList);
    });

    // listens for initiate view request from viewer
    socket.on('initiateView', (eventId) => {
      // make a new Node for this viewer and add it to nodeTracker
      var newViewer = new ConspectioNode(socket.id, eventId);
      nodeTracker.push(newViewer);

      // check #1: find broadcaster(s) for this eventId - we need this as the origin socketId
      var broadcastersList = alasql('SELECT socketId FROM ? WHERE eventId=? AND origin=""', [nodeTracker, eventId]); 
      
      // grab the first one
      var broadcaster = broadcastersList[0];
      var broadcasterId = broadcastersList.map((socketIdObj) => {
        return socketIdObj.socketId;
      })[0];

      // declare var for degree checked

      // check #2: determine broadcaster capacity
      var broadcasterCapacity = alasql('SELECT socketId FROM ? WHERE arrlen(leechers) < 3 AND socketId=?', [nodeTracker, broadcasterId]);


      // if there is capacity, connect newViewer to this broadcaster - take the broadcaster's socketId and make it newViewer's source and origin
      if(broadcasterCapacity.length) {
        // take the newViewer socketId and add it to the broadcaster's leecher's array
        broadcaster.leechers.push(socket.id);

        // set the appropriate origin, source, degree for newViewer
        newViewer.origin = broadcaster.socketId;
        newViewer.source = broadcaster.socketId;
        newViewer.degree = broadcaster.degree + 1;

        // emit message to broadcaster to initiateConnection
      }



        

          

        // if no capacity, query with eventId and broadcasterId as origin and degree + 1 ordered by the min number of leechers - just one

          // if able to find a potential relay broadcaster with capacity, take its socketId and add it as source for newViewer, newViewer's degree is this relay broadcaster's degree + 1
            // update relay broadcaster leechers array to include socketId of newViewer

          // if unable to find, increment degree and find again

      //LEGACY CODE
      // add this viewer socket to eventTracker
      // if(eventTracker[eventTag]) {
      //   //grab any exisiting viewers 
      //   var viewerSocketIdArr = Object.keys(eventTracker[eventTag].viewers);
      //   //if there is a viewer, store firstViewer here
      //   var firstViewer;
      //   if(viewerSocketIdArr.length) {
      //     firstViewer = eventTracker[eventTag].viewers[viewerSocketIdArr[0]];
      //   }
      //   //save ref to this socket obj 
      //   eventTracker[eventTag].viewers[socket.id] = socket.id; 
      //   console.log('inside initiateView', eventTracker);

      //   // send message to broadcaster that a viewer wants to connect
      //   var broadcasterSocketIdArr = Object.keys(eventTracker[eventTag].broadcasters);

      //   if(firstViewer) {
      //     io.to(firstViewer).emit('initiateRelay', socket.id, broadcasterSocketIdArr[0]);
      //   } else {
      //     for(var i = 0; i < broadcasterSocketIdArr.length; i++) {
      //     console.log('broadcasterSocketIdArr', broadcasterSocketIdArr[i]);
      //       // server emits a message to broadcaster to initiate connection
      //       // socket.id is from viewer
      //       io.to(broadcasterSocketIdArr[i]).emit('initiateConnection', socket.id);
      //     }
      //   }
      // }
    });

    socket.on('signal', (toId, message) => {
      console.log('inside signal', toId);
      // send the peerObj to the peerId
      io.to(toId).emit('signal', socket.id, message);
    });

    //listens for disconnection
    //TODO: clean up connections object of any rtc connections that were prev. connected to the dropped relayer.
    socket.on('disconnect', () => {

      // lookup Node with this socket.id - CAREFUL HERE!!! there can be multiple results because one viewer node per broadcaster
      var currNode = alasql('SELECT * FROM nodeTracker WHERE socketId = ?', [socket.id])[0];

      // determine whether Node is Viewer or Broadcaster
      if(currNode.origin) { // this is a VIEWER

        //CASE 1: Viewer has no leechers and disconnects      

        // retrieve the sourceNode
        var sourceOrigin = (currNode.degree === 1) ? '': currNode.origin; // directly connected to broadcaster or not
        var sourceNode = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.source, sourceOrigin])[0];

        // remove this viewer's socketId from source's leechers
        var index = sourceNode.leechers.indexOf(currNode.socketId);
        sourceNode.leechers.splice(index, 1);
        // update the sourceNode's leechers - need to UPDATE????? or already updated with splice???
        // alasql('UPDATE nodeTracker SET leechers = ? WHERE socketId = ? AND origin = ?', [sourceNode.leechers, sourceNode.socketId, sourceOrigin]);

        // remove viewer node from nodeTracker
        alasql('DELETE from nodeTracker WHERE socketId = ? AND origin = ?', [currNode.socketId, currNode.origin]);

        // client side notification - emit message to broadcaster/relayBroadcaster that viewer left to clean up conspectio.connections{}
        io.to(sourceNode.socketId).emit('viewerLeft', currNode.socketId);
 
        //CASE 2: Viewer has leechers and disconnects (Viewer is a Relay Broadcaster)
            //find viewer's source and update their leechers array
            //for all leechers in the relayBroadcaster's leechers array
              //recursively trace through the leechers and find new source (broadcaster or relayBroadcaster), update degree of leechers
              // client side notification - emit message to leechers that viewer (relayBroadcaster in the eyes of leechers) left to clean up conspectio.connections{}
            //remove viewer node from nodeTracker
            // client side notification - emit message to broadcaster/relay broadcaster that viewer left to clean up conspectio.connections{}
        
        // recursively update leechers of currNode
        recurseUpdateNodes(currNode, currNode.origin, currNode.source);

      } else { // this is a BROADCASTER
        // CASE 3: Broadcaster disconnects with leechers
        // CASE 4: Broadcaster disconnects with NO leechers

        //recursively trace through the leechers, if any, and remove reference (delete leechers' nodes from the end to beginning) to this broadcaster
        recurseRemoveNodes(currNode, currNode.socketId);  
      }

    



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
    });
  });

  // helper function to recursively update node's source after relayBroadcaster drops
  function recurseUpdateNodes(currNode, targetOrigin, targetSource) {
    // iterate through node's leechers
    for(var i = 0; i < currNode.leechers.length; ++i) {
      var currLeecher = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.leechers[i], targetOrigin])[0];

      if(targetSource) { // 1st update
        // update currLeecher's source to be targetSource
        currLeecher.source = targetSource;
        // decrement currLeecher's degree
        currLeecher.degree = currLeecher.degree - 1;
        alasql('UPDATE nodeTracker SET source = ?, degree = ? WHERE socketId = ? AND origin = ?', [targetSource, currLeecher.degree, currLeecher.socketId, currLeecher.origin]);

        // update targetSource's leechers to include currLeecher
        var sourceOrigin = (currNode.degree === 1) ? '': currNode.origin; // directly connected to broadcaster or not
        var sourceNode = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [targetSource, sourceOrigin])[0];
        sourceNode.leechers.push(currLeecher.socketId);

        // emit message to targetSource to 'initiateConnection' with currLeecher
        io.to(targetSource).emit('initiateConnection', currLeecher.socketId);

        // emit message to currLeecher that 'broadcasterLeft' which is currNode
        io.to(currLeecher.socketId).emit('broadcasterLeft', currNode.socketId);

      } else { // not 1st update
        // need to decrement currLeecher's degree by 1
        currLeecher.degree = currLeecher.degree - 1;
        alasql('UPDATE nodeTracker SET degree = ? WHERE socketId = ? AND origin = ?', [currLeecher.degree, currLeecher.socketId, currLeecher.origin]);

        // emit message to currNode to 'updateConnection', passing in currLeecher socketId and origin
        io.to(currNode.socketId).emit('updateConnection', currLeecher.socketId, currLeecher.origin);
      }

      // recurse on currLeecher
      recurseUpdateNodes(currLeecher, targetOrigin, ''); // empty targetSource to indicate post 1st update
    }
  }

  // helper function for recursively tracing through the leechers and removing reference (delete leechers' nodes from the end to beginning) to this broadcaster
  function recurseRemoveNodes(currNode, targetOrigin) {
    console.log('inside recurseNodes', currNode);
    
    // iterate through leechers - for each leecher do recursive call
    for(var i = 0; i < currNode.leechers.length; ++i) {
      var currLeecher = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.leechers[i], targetOrigin])[0];
      console.log('i', i, 'currLeecher', currLeecher);
      recurseNodes(currLeecher, targetOrigin, doFunc);
    }

    // done processing leechers - remove this node from nodeTracker
    alasql('DELETE from nodeTracker WHERE socketId = ? AND origin = ?', [currNode.socketId, currNode.origin]);

    // client side notification - emit message to leechers that broadcaster left to clean up conspectio.connections{}
    if(currNode.origin) {
      io.to(currNode.socketId).emit('broadcasterLeft', currNode.origin);
    }  
  }

}


