const ConspectioBroadcaster = require('./conspectioBroadcaster.js');

const broadcasterRTCEndpoint = (stream) => {
  conspectio.socket.on('initiateConnection', (viewerId, originId) => {
    console.log('viewer ', viewerId, ' wants to connect');
    var newPC = new ConspectioBroadcaster(viewerId, stream, originId);
    console.log('broadcaster newPC', newPC);
    // composite key = origin (which is this broadcaster's socket.id) + viewerId (who you are connected to)
    var compositeKey = originId + viewerId;
    conspectio.connections[compositeKey] = newPC;
    newPC.init();
    newPC.createOfferWrapper();
  });

  conspectio.socket.on('signal', (fromId, message, originId) => {
    var compositeKey = originId + fromId;

    var currentPC = conspectio.connections[compositeKey];
    if(currentPC) {
      if(message.type === 'answer') {
        currentPC.receiveAnswer(message.answer);
      } else if (message.type === 'candidate') {
        currentPC.addCandidate(message.candidate);
      }
    }
  });

  // event listener for viewer has left - clean up conspectio.connections{}
  conspectio.socket.on('viewerLeft', (viewerId, originId) => {
    console.log('viewer ', viewerId, ' has left');
    var compositeKey = originId + viewerId;
    var currentPC = conspectio.connections[compositeKey];
    if(currentPC) {
      currentPC.closeWrapper();
      delete conspectio.connections[compositeKey];
    }
    
  });
};

module.exports = broadcasterRTCEndpoint;