module.exports = (http) => {
  const io = require ('socket.io')(http);
  const ConspectioNode = require('./conspectioNode.js');
  const alasql = require('alasql');
  // custom function that returns array length
  alasql.fn.arrlen = function(arr) { return arr.length; };

  //create nodeTracker table instead of nodeTracker[] due to compatiability with alasql CRUD operations
  alasql('CREATE TABLE nodeTracker');
  //max number of leechers per broadcast relayer
  const maxRelayers = 1;
  const maxBroadcasters = 2;


  io.on('connection', (socket) => {
  
    console.log('socket connected', socket.id);

    // NOTE: handle more than 1 broadcaster per eventId
    //listens for event tag from broadcaster
    socket.on('addBroadcaster', (eventId) => {
      // add a new broadcaster asssociated with that event id into nodeTracker table 
      var newBroadcaster = new ConspectioNode(socket.id, eventId);
      alasql('INSERT into nodeTracker VALUES ?', [newBroadcaster]);
      console.log("addBroadcaster NODETRACK", alasql('SELECT * from nodeTracker'));
      var otherBroadcasters = alasql('SELECT * FROM nodeTracker WHERE eventId = ? AND origin = ? AND socketId NOT IN @(?)', [newBroadcaster.eventId, '', [newBroadcaster.socketId]]);
      console.log('OTHERBROADCASTERS', otherBroadcasters);
      var noMoreBroadcasters = (otherBroadcasters.length) ? false : true;
      console.log('noMoreBroadcasters', noMoreBroadcasters)
      // if there's already a broadcaster for this eventId, need to inform all viewers and their leechers (DFS recursive notifications) of new broadcaster
      if(! noMoreBroadcasters) {
        // pick 1 existing broadcaster and recurse through it - each leecher needs a new node where the origin is this new broadcaster
        //emit msg to client-side which is this new broadcaster 'initiateConnection' to create a connections obj. to all leechers
        console.log('otherBroadcasters[0]::', otherBroadcasters[0])
        console.log('newBroadcaster.socketId::',newBroadcaster.socketId);
        console.log('newBroadcaster::', newBroadcaster)
        recurseCreateNodes(otherBroadcasters[0], newBroadcaster.socketId, newBroadcaster, true);
      }  

      // print out the nodeTracker to ensure all new nodes added correctly
      console.log('addBroadcaster event done, nodeTracker state: ', alasql('SELECT * FROM nodeTracker'));
    })

    //listens for broadcaster when they stop streaming
    socket.on('removeBroadcaster', (eventTag) => {
      // lookup this broadcaster node based on eventId and socketId
      var currNode = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND eventId = ? AND origin = ?', [socket.id, eventTag, ''])[0];

      if(currNode) {
        // determine if any broadcasters left for this event?  if so, emit 'broadcasterLeft', else emit 'noMoreBroadcasters'
        var otherBroadcasters = alasql('SELECT * FROM nodeTracker WHERE eventId = ? AND origin = ? AND socketId NOT IN @(?)', [currNode.eventId, '', [currNode.socketId]]);
        var noMoreBroadcasters = (otherBroadcasters.length) ? false : true;
        
        //recursively trace through the leechers, if any, and remove reference (delete leechers' nodes from the end to beginning) to this broadcaster
        //***TODO: check for the case where noMoreBroadcasters is false!
        recurseRemoveNodes(currNode, currNode.socketId, noMoreBroadcasters); 
        console.log('broadcaster clicked stop stream', alasql('SELECT * FROM nodeTracker'));
      }

    });

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

      // check #1: find broadcaster(s) for this eventId - we need this as the origin socketId// LIMIT 2
      var sqlString = 'SELECT * FROM nodeTracker WHERE eventId=? AND origin="" LIMIT ' + maxBroadcasters;
      var broadcastersList = alasql(sqlString, [eventId]); 

      broadcastersList.forEach((broadcaster) => {
        var sourcesToCheck = [broadcaster.socketId];
        var foundCapacity = false;

        var originId = '';

        while(!foundCapacity){
          
          //Store broadcaster node with the min amout of leechers
          console.log('SOURCESTOCHECK:', sourcesToCheck);
          console.log('originid:', originId);

          var broadcasterNode = alasql('SELECT * FROM nodeTracker WHERE arrlen(leechers) < ? AND socketId IN @(?) AND origin = ? ORDER BY arrlen(leechers) LIMIT 1', [maxRelayers, sourcesToCheck, originId])[0];

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
            //update origin depending on degree
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
              io.to(broadcasterIdWithCapacity).emit('initiateConnection', socket.id, broadcasterIdWithCapacity);
            } else {
              io.to(broadcasterIdWithCapacity).emit('initiateRelay', socket.id, broadcasterNode.source, broadcasterNode.origin); 
            }
          } else {
            //every relayer in sourcesToCheck is at capacity. get their leechers array and check those for capacity next with another iteration in the while loop
            console.log('SOURCESTOCHECK:', sourcesToCheck, 'broadcaster.socketid:', broadcaster.socketId);
            //helper function to get an array of leechers for 1 relayer
            function getLeechers(socketId, originId){
              return alasql('SELECT leechers FROM nodeTracker WHERE socketId=? AND origin= ?',[socketId, originId])[0];
            }
            
            var result = [];
            var newRelayersToCheck = sourcesToCheck.map( (relayerId) => {
              result.push(getLeechers(relayerId, originId).leechers);
            });
            sourcesToCheck = flattenDeep(result);
            //for any degree > 0, originId is not an empty string
            originId = broadcaster.socketId;
          }
        } //end while loop
      });//end of forEach
    });

    socket.on('signal', (toId, message, originId) => {
      // send the peerObj to the peerId
      io.to(toId).emit('signal', socket.id, message, originId);
    });

    //listens
    socket.on('receivedStream', (sourceId, originId) => {
      console.log('receivedStream');
      console.log('server received stream - sourceid:', sourceId, 'originId:', originId)
      console.log('NODETRACKER:', alasql('SELECT * FROM nodeTracker'));
      //look up leechers of this viewer
      var currNodeId = socket.id;
      var currNode = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND source = ? AND origin = ?', [currNodeId, sourceId, originId])[0];
      console.log('receivedStream currNode:::::::', currNode);
      //if no leechers, don't do anything
      //if leechers, for each leecher, emit 'relayStream' with 2 params: this node's sourceId & this node's leecher's socketId
      for (var i = 0; i < currNode.leechers.length; i++){
        io.to(currNodeId).emit('relayStream', sourceId, currNode.leechers[i], originId);
      }
    });


    //listens for disconnection
    socket.on('disconnect', () => {

      // lookup Node with this socket.id - there can be multiple results because one viewer node per broadcaster
      var currNodeList = alasql('SELECT * FROM nodeTracker WHERE socketId = ?', [socket.id]);
      console.log('inside disconnect currNodeList', currNodeList);

      for(var i = 0; i < currNodeList.length; ++i) {
        var currNode = currNodeList[i];

        // determine whether Node is Viewer or Broadcaster
        if(currNode.origin) { // this is a VIEWER

          //CASE 1: Viewer has no leechers and disconnects      

          // retrieve the sourceNode. sourceOrigin is currNode's source's origin value.
          var sourceOrigin = (currNode.degree === 1) ? '': currNode.origin; // directly connected to broadcaster or not
          var sourceNode = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.source, sourceOrigin])[0];

          // remove this dropped viewer's socketId from sourceNode's leechers
          var index = sourceNode.leechers.indexOf(currNode.socketId);
          sourceNode.leechers.splice(index, 1);

          // remove viewer node from nodeTracker -- should this be called after recurse function???
          alasql('DELETE FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.socketId, currNode.origin]);
          console.log('viewer without leechers left. nodeTracker:',alasql('SELECT * FROM nodeTracker'));
          // client side notification - emit message to broadcaster/relayBroadcaster that viewer left to clean up conspectio.connections{}
          io.to(sourceNode.socketId).emit('viewerLeft', currNode.socketId, currNode.origin);
  
          //CASE 2: Viewer has leechers and disconnects (Viewer is a Relay Broadcaster)
            //find viewer's source and update their leechers array
            //for all leechers in the relayBroadcaster's leechers array
              //recursively trace through the leechers and find new source (broadcaster or relayBroadcaster), update degree of leechers
              // client side notification - emit message to leechers that viewer (relayBroadcaster in the eyes of leechers) left to clean up conspectio.connections{}
            //remove viewer node from nodeTracker
            // client side notification - emit message to broadcaster/relay broadcaster that viewer left to clean up conspectio.connections{}
          
          // recursively update leechers of currNode - pass in sourceNode
          recurseUpdateNodes(currNode, currNode.origin, sourceNode, true);

        } else { // this is a BROADCASTER
          // CASE 3: Broadcaster disconnects with leechers
          // CASE 4: Broadcaster disconnects with NO leechers
          
          // determine if any broadcasters left for this event?  if so, emit 'broadcasterLeft', else emit 'noMoreBroadcasters'
          var otherBroadcasters = alasql('SELECT * FROM nodeTracker WHERE eventId = ? AND origin = ? AND socketId NOT IN @(?)', [currNode.eventId, '', [currNode.socketId]]);
          var noMoreBroadcasters = (otherBroadcasters.length) ? false : true;

          //recursively trace through the leechers, if any, and remove reference (delete leechers' nodes from the end to beginning) to this broadcaster
          recurseRemoveNodes(currNode, currNode.socketId, noMoreBroadcasters);
          console.log('nodeTracker after broadcaster disconnects',alasql('SELECT * FROM nodeTracker'));  
        }
      }
    });
  });

  // helper function to recursively create new nodes for all leechers for new broadcaster
  function recurseCreateNodes(currNode, targetOrigin, targetNode, isFirstConnect) {
    // for each leecher, create a new Node
    for(var i = 0; i < currNode.leechers.length; ++i) {

      var currLeecherOrigin = (currNode.degree === 0) ? currNode.socketId: currNode.origin; // directly connected to broadcaster or not
      // retrieve the currLeecher
      console.log('currLeecherOrigin', currLeecherOrigin);
      var currLeecher = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.leechers[i], currLeecherOrigin])[0];
      console.log('currLeecher', currLeecher);
      // create a new Node for each leecher - copy the leecher for the otherBroadcasters
      var newNode = new ConspectioNode(currLeecher.socketId, currLeecher.eventId);
      newNode.degree = currLeecher.degree;
      newNode.origin = targetOrigin;
      var newNodeSource = (currLeecher.degree === 1) ? targetOrigin: currLeecher.source; // directly connected to broadcaster or not
      newNode.source = newNodeSource;
      // push newNode into targetNode.leechers
      targetNode.leechers.push(newNode.socketId);
      //insert newNode into nodeTracker table
      alasql('INSERT INTO nodeTracker VALUES ?', [newNode]);

      if(isFirstConnect) {
        io.to(targetNode.socketId).emit('initiateConnection', newNode.socketId, targetOrigin);
      }

      // recurse call on the currLeecher passing in targetOrigin and the newNode to update the nodeTracker table
      recurseCreateNodes(currLeecher, targetOrigin, newNode, false);
    }
  }

  // helper function to recursively update node's source after relayBroadcaster drops - targetSource is a Node
  // isFirstReconnect is true if currNode is the head of the dropped portion
  function recurseUpdateNodes(currNode, targetOriginId, targetSourceNode, isFirstReconnect) {
    // iterate through currNode's leechers
    for(var i = 0; i < currNode.leechers.length; ++i) {
      var currLeecher = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.leechers[i], targetOriginId])[0];

      if(isFirstReconnect) { // 1st - reconnecting head leecher to a new source
        // update currLeecher's source to be targetSource
        currLeecher.source = targetSourceNode.socketId;
        // update currLeecher's degree
        currLeecher.degree = targetSourceNode.degree + 1;

        // pseudo UPDATE - delete currLeecher Node and then insert it back
        //TODO: make a function for UPDATE
        alasql('DELETE from nodeTracker WHERE socketId = ? AND origin = ?', [currLeecher.socketId, currLeecher.origin]);
        alasql('INSERT INTO nodeTracker VALUES ?', [currLeecher]);
      
        // update targetSource's leechers to include currLeecher
        targetSourceNode.leechers.push(currLeecher.socketId);

        //check targetSource origin and to decide who to connect to
        if(targetSourceNode.origin === ''){
          // emit message to targetSource to 'initiateConnection' with currLeecher
          io.to(targetSourceNode.socketId).emit('initiateConnection', currLeecher.socketId, currLeecher.origin);
        } else {
          io.to(targetSourceNode.socketId).emit('initiateRelay', currLeecher.socketId, targetSourceNode.source); //??is this line needed??
        }

        // emit message to currLeecher that 'broadcasterLeft' which is currNode
        io.to(currLeecher.socketId).emit('broadcasterLeft', currNode.socketId, currNode.origin);
        recurseUpdateNodes(currLeecher, targetOriginId, targetSourceNode, false);
      } else { // not 1st update
        // need to increment currLeecher's degree by 1 based on its sourceNode's degree
        currLeecher.degree = currNode.degree + 1;

        // pseudo UPDATE - delete currLeecher Node and then insert it back
        alasql('DELETE FROM nodeTracker WHERE socketId = ? AND origin = ?', [currLeecher.socketId, currLeecher.origin]);
        alasql('INSERT INTO nodeTracker VALUES ?', [currLeecher]);
      
        // recursively update the nodeTracker table only, no emitting events
        recurseUpdateNodes(currLeecher, targetOriginId, currNode, false);
      }
    }
  }

  // helper function for recursively tracing through the leechers and removing reference (delete leechers' nodes from the end to beginning) to this broadcaster
  function recurseRemoveNodes(currNode, targetOrigin, noMoreBroadcasters) {
    
    // iterate through leechers - for each leecher do recursive call
    for(var i = 0; i < currNode.leechers.length; ++i) {
      var currLeecher = alasql('SELECT * FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.leechers[i], targetOrigin])[0];
      recurseRemoveNodes(currLeecher, targetOrigin, noMoreBroadcasters);
    }

    // done processing leechers - remove this node from nodeTracker
    alasql('DELETE FROM nodeTracker WHERE socketId = ? AND origin = ?', [currNode.socketId, currNode.origin]);
    console.log('DELETED. nodeTracker:',alasql('SELECT * FROM nodeTracker'));
    // client side notification - emit message to leechers that noMoreBroadcasters or broadcasterLeft to clean up conspectio.connections{}
    if(currNode.origin) {
      if(noMoreBroadcasters) {
        io.to(currNode.socketId).emit('noMoreBroadcasters', currNode.source, currNode.origin);
        //emit to currNode.source that 'viewerLeft' for currNode where origin is currNode.origin
        io.to(currNode.source).emit('viewerLeft', currNode.socketId, currNode.origin);
      } else {
        io.to(currNode.socketId).emit('broadcasterLeft', currNode.source, currNode.origin);
      }    
    }  
  }
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