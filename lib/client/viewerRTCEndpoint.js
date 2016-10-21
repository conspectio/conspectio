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

    conspectio.socket.on('updateConnection', (viewerId, origin) => {
      console.log('inside updateConnection, viewerId: ', viewerId, 'origin: ', origin);
      // work on renegotiate stream OK???
    });

};

module.exports = viewerRTCEndpoint;