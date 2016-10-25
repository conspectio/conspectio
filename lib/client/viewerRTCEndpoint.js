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
      console.log('thePCWithStream stream', thePCWithStream, thePCWithStream.remoteStream);

      var newPC = new ConspectioBroadcaster(viewerReceiverId, thePCWithStream.remoteStream, originId);
      console.log('broadcaster newPC in viewerRTC', newPC, newPC.stream);

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
        
      } else if (message.type === 'candidate') { // composite key doesn't work here: can be v1v2 OR v2v1
      //TODO: check that the keys work
        const compositeKey3 = originId + fromId;
        // const compositeKey4 = fromId + originId;

        // var currentPC = conspectio.connections[compositeKey3] || conspectio.connections[compositeKey4];
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
      var compositeKey2 = originId + leecherId 
      var sourceStream = conspectio.connections[compositeKey1].remoteStream;
      var leecherPC = conspectio.connections[compositeKey2];

      leecherPC.replaceStreamWrapper(sourceStream);
      console.log('sourceStream:', sourceStream);
      leecherPC.createOfferWrapper();
    });

    // inform developer if there are no more broadcasters
    conspectio.socket.on('noMoreBroadcasters', () => {
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
    });

    // event listener for viewer has left - clean up conspectio.connections{}
    conspectio.socket.on('viewerLeft', (viewerId) => {
      console.log('viewer ', viewerId, ' has left');
      delete conspectio.connections[conspectio.socket.id + viewerId];
    });
    
};

module.exports = viewerRTCEndpoint;