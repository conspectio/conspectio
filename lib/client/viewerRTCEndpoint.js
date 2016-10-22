const ConspectioViewer = require('./conspectioViewer.js');
const ConspectioBroadcaster = require('./conspectioBroadcaster.js');

const viewerRTCEndpoint = (eventTag, viewerHandlers) => {

    // viewer wants to initiate contact with broadcaster
    conspectio.socket.emit('initiateView', eventTag);

    //
    conspectio.socket.on('initiateRelay', (viewerReceiverId, broadcasterId) => {
      console.log('viewerReceiver wants to connect', viewerReceiverId)
      var broadcasterPC = conspectio.connections[broadcasterId];
      console.log('broadcasterPC stream', broadcasterPC, broadcasterPC.remoteStream);
      var newPC = new ConspectioBroadcaster(viewerReceiverId, broadcasterPC.remoteStream);
      console.log('broadcaster newPC in viewerRTC', newPC, newPC.stream);
      conspectio.connections[viewerReceiverId] = newPC;
      newPC.init();
      newPC.createOfferWrapper();
    });

    // viewer receives offer or candidate signaling messages
    conspectio.socket.on('signal', (fromId, message) => {
      if(message.type === 'offer') {
        var newPC = new ConspectioViewer(fromId, viewerHandlers);
        conspectio.connections[fromId] = newPC;
        newPC.init();
        newPC.receiveOffer(message.offer);
        newPC.createAnswerWrapper(); // since this needs to happen after receiveOffer, put as callback into receiveOffer?
      } else if (message.type === 'candidate') {
        const currentPC = conspectio.connections[fromId];
        if (currentPC){
          currentPC.addCandidate(message.candidate);
        }
      } else if (message.type === 'answer') {
        const currentPC = conspectio.connections[fromId];
        if(currentPC) {
          currentPC.receiveAnswer(message.answer);
        }
      }
    });

    // inform developer if there are no more broadcasters
    conspectio.socket.on('noMoreBroadcasters', () => {
      // invoke the viewHandler callback passed in by developer to handle no more broadcasters situation
      if(viewerHandlers && viewerHandlers.noMoreBroadcasters) {
        viewerHandlers.noMoreBroadcasters();
      }
    });

    //     //redirect viewer to events page if there are no more broadcasters streaming their event
    // conspectio.socket.on('redirectToEvents', (destination) => {
    //   // invoke the viewHandler callback passed in by developer to handle no more broadcasters situation
    //   if(viewerHandlers && viewerHandlers.noMoreBroadcasters) {
    //     viewerHandlers.noMoreBroadcasters(destination);
    //   }
    // });

    //broadcaster left - close connection & remove from connections object
    conspectio.socket.on('broadcasterLeft', (broadcasterId) => {
      const currentPC = conspectio.connections[broadcasterId];
      if (currentPC){
        currentPC.closeWrapper();
        delete conspectio.connections[broadcasterId];
      }
    });

    // event listener for viewer has left - clean up conspectio.connections{}
    conspectio.socket.on('viewerLeft', (viewerId) => {
      console.log('viewer ', viewerId, ' has left');
      delete conspectio.connections[viewerId];
    });
    
    conspectio.socket.on('initiateUpdateConnection', (viewerId, origin) => {
      console.log('inside initiateUpdateConnection, viewerId: ', viewerId, 'origin: ', origin);
      // work on renegotiate stream OK???
      var currentPC = conspectio.connections[viewerId];
      console.log('inside initiateUpdateConnection, stream', currentPC.stream);
    });

    conspectio.socket.on('receiveUpdateConnection', (broadcasterId, origin) => {
      console.log('inside receiveUpdateConnection, broadcasterId: ', broadcasterId, 'origin: ', origin);
      // work on renegotiate stream OK???
      var currentPC = conspectio.connections[broadcasterId];
      console.log('inside receiveUpdateConnection, stream', currentPC.remoteStream);
    });

};

module.exports = viewerRTCEndpoint;