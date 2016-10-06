// chrome://webrtc-internals
var globalStream;
var broadcasterPeer;
var currViewerId;
var pc;

const socket = io();
socket.on('connect', () => {
  console.log('broadcaster socket connected', socket.id);
  
  socket.on('initiateConnection', (viewerId) => {
    console.log('viewer ', viewerId, ' wants to connect');
    currViewerId = viewerId;
    createPeerConnection();

    pc.createOffer((offer) => {
      send({
        type: "offer",
        offer: offer
      });
      pc.setLocalDescription(new RTCSessionDescription(offer));
    }, (error) => {
      console.log('Error with creating broadcaster offer', error);
    });
  });

  socket.on('signal', (fromId, message) => {
    currViewerId = fromId;

    if(message.type === 'answer') {
      pc.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if(message.type === 'candidate') {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }

  });

});

createPeerConnection = () => {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.addStream(globalStream);
    pc.oniceconnectionstatechange = handleIceConnectionChange;
  } catch(e) {
    console.log('Failed to create RTCPeerConnetion: ', e.message);
    return;
  }
};

send = (message) => {
  if(currViewerId) {
    socket.emit('signal', currViewerId, message);
  }
};

handleIceCandidate = (event) => {
  console.log('handleIceCandidate event: ', event);
  if(event.candidate) {
    send({
      type: "candidate",
      candidate: event.candidate
    });
  }
};

handleIceConnectionChange = () => {
  console.log('inside handleIceCandidateDisconnect', pc.iceConnectionState);
  if(pc.iceConnectionState === 'disconnected') {
    console.log('inside pc.onIceConnectionState')
    pc.close();
  }
}

sendEventTag = () => {
  let eventTag = $('#eventTag').val();

  if(eventTag.length) {
    $('#startButton').prop('disabled', true);
    $('#stopButton').prop('disabled', false);
    socket.emit('sendEventTag', eventTag);

    var video = $('#broadcastStream')[0];
     
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
     
    if (navigator.getUserMedia) {       
        navigator.getUserMedia({video: true, audio: false}, handleVideo, videoError);
    }
     
    function handleVideo(stream) {
      let eventTag = $('#eventTag').val();
      globalStream = stream;
      video.src = window.URL.createObjectURL(stream);
    }
     
    function videoError(e) {
        // do something
        console.log('videoerror function', e);
    }

  } else {
    alert('please enter a tag name to start streaming');
  }
};

stopStream = () => {
  globalStream.getTracks()[0].stop();
  let eventTag = $('#eventTag').val();
  $('#startButton').prop('disabled', false);
  $('#stopButton').prop('disabled', true);
  socket.emit('removeBroadcaster', eventTag);
};


