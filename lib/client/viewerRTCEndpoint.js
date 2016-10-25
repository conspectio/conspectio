const ConspectioViewer = require('./conspectioViewer.js');
const ConspectioBroadcaster = require('./conspectioBroadcaster.js');

const viewerRTCEndpoint = (eventTag, viewerHandlers) => {

    // viewer wants to initiate contact with broadcaster
    conspectio.socket.emit('initiateView', eventTag);

    // initiateRelay is turning viewer into relay broadcaster
    conspectio.socket.on('initiateRelay', (viewerReceiverId, sourceId, originId) => {
      console.log('viewerReceiver wants to connect', viewerReceiverId)

      var compositeKey1 = originId + sourceId;

      var thePCWithStream = conspectio.connections[compositeKey1];

      var newPC = new ConspectioBroadcaster(viewerReceiverId, thePCWithStream.remoteStream, originId);

      var compositeKey2 = originId + viewerReceiverId;

      conspectio.connections[compositeKey2] = newPC;
      newPC.init();
      newPC.createOfferWrapper();
    });

    // viewer receives offer or candidate signaling messages
    conspectio.socket.on('signal', (fromId, message, originId) => {
      
      if(message.type === 'offer') {
        const compositeKey1 = originId + fromId;

        //if a PC already exists, then look it up
        if(conspectio.connections[compositeKey1]){ 
          var existingPC = conspectio.connections[compositeKey1];
          existingPC.receiveOffer(message.offer);
          existingPC.createAnswerWrapper();
        } else {
          //otherwise create a newPC
          var newPC = new ConspectioViewer(fromId, viewerHandlers, originId);
          conspectio.connections[compositeKey1] = newPC;
          newPC.init();
          newPC.receiveOffer(message.offer);
          newPC.createAnswerWrapper();
        }
        
      } else if (message.type === 'candidate') { 
        const compositeKey3 = originId + fromId;
        var currentPC = conspectio.connections[compositeKey3];
        if (currentPC){
          currentPC.addCandidate(message.candidate);
        }
      } else if (message.type === 'answer') { 
        const compositeKey2 = originId + fromId;
        const currentPC = conspectio.connections[compositeKey2];
        if(currentPC) {
          currentPC.receiveAnswer(message.answer);
        }
      }
    });

    conspectio.socket.on('relayStream', (sourceId, leecherId, originId) => {
      //look up sourceId & leecherId in connections object to get the stream we want
      // remove stream from leecher PC
      //add stream from leecher PC
      //start renegotiation process
      var compositeKey1 = originId + sourceId;
      var compositeKey2 = originId + leecherId;
      //TODO: see if  conspectio.connections[compositeKey1] is defined first before remoteStream
      var sourceStream = conspectio.connections[compositeKey1].remoteStream;
      var leecherPC = conspectio.connections[compositeKey2];

      if(!leecherPC) {
        leecherPC = new ConspectioBroadcaster(leecherId, sourceStream, originId);
        leecherPC.init();
        conspectio.connections[compositeKey2] = leecherPC;
      } else {
        leecherPC.replaceStreamWrapper(sourceStream);
      }
      leecherPC.createOfferWrapper();
    });

    // inform developer if there are no more broadcasters
    conspectio.socket.on('noMoreBroadcasters', (sourceId, originId) => {
      var compositeKey = originId + sourceId;
      const currentPC = conspectio.connections[compositeKey];
      if (currentPC){
        currentPC.closeWrapper();
        delete conspectio.connections[compositeKey];
      }
      // invoke the viewHandler callback passed in by developer to handle no more broadcasters situation
      if(viewerHandlers && viewerHandlers.noMoreBroadcasters) {
        viewerHandlers.noMoreBroadcasters();
      }
    });

    //broadcaster left - close connection & remove from connections object
    conspectio.socket.on('broadcasterLeft', (relayerId, originId) => {
      var compositeKey = originId + relayerId;
      const currentPC = conspectio.connections[compositeKey];
      if (currentPC){
        currentPC.closeWrapper();
        delete conspectio.connections[compositeKey];
      }
      if(viewerHandlers && viewerHandlers.broadcasterRemoved) {
        viewerHandlers.broadcasterRemoved(compositeKey);
      }
    });

    // event listener for viewer has left - clean up conspectio.connections{}
    conspectio.socket.on('viewerLeft', (viewerId, originId) => {
      var compositeKey = originId + viewerId;
      const currentPC = conspectio.connections[compositeKey];
      if (currentPC){
        currentPC.closeWrapper();
        delete conspectio.connections[compositeKey];
      }
      console.log('viewer ', viewerId, ' has left');
    });
    
};

module.exports = viewerRTCEndpoint;