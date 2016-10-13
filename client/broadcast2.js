//refactored broadcast.js to a class constructor
var globalStream;
var connections = {};

class ConspectioBroadcaster {
  constructor(viewerId) {
    this.viewerId = viewerId;
    this.pc;
  }

  getViewerId() {
    console.log('getViewerId', this.viewerId);
    return this.viewerId;
  }

  init() {
    this.pc = new RTCPeerConnection({
      'iceServers': [
        {
          'url': 'stun:stun.l.google.com:19302'
        },
        {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        }
        // {
        //   url: 'turn:192.158.29.39:3478?transport=udp',
        //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        //   username: '28224511:1379330808'
        // },
        // {
        //   url: 'turn:192.158.29.39:3478?transport=tcp',
        //   credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        //   username: '28224511:1379330808'
        // }
      ]
    });
    // this.pc = new RTCPeerConnection(null);
    this.pc.viewerId = this.viewerId; // add custom attribute
    this.pc.onicecandidate = this.handleIceCandidate;
    this.pc.addStream(globalStream);
    this.pc.oniceconnectionstatechange = this.handleIceConnectionChange;
  }

  handleIceCandidate(event) {
   console.log('handleIceCandidate event: ', event);
   console.log('handleIceCandidate this', this);
   console.log('handleIceCandidate viewerId', this.viewerId);
    if(event.candidate) {
      send(this.viewerId, {
        type: "candidate",
        candidate: event.candidate
      });
    }  
  }

  handleIceConnectionChange() {
    if(this.pc) {
      console.log('inside handleIceCandidateDisconnect', this.pc.iceConnectionState);
      if(this.pc.iceConnectionState === 'disconnected') {
        console.log('inside pc.onIceConnectionState')
        this.pc.close();
        delete connections[this.viewerId];
      }
    }
  }

  createOfferWrapper() {
    this.pc.createOffer( (offer) => {
      send(this.viewerId, {
        type: "offer",
        offer: offer
      });
      this.pc.setLocalDescription(new RTCSessionDescription(offer));
    }, (error) => {
      console.log('Error with creating broadcaster offer', error);
    },{
      iceRestart: true
    });
  }

  receiveAnswer(answer) {
    this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  addCandidate(candidate) {
    this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  removeStreamWrapper() {
    this.pc.removeStream(globalStream);
    console.log('removeStreamWrapper invoked on broadcast2.js')
  }

  closeWrapper() {
    this.pc.close();
    console.log('broadcast2.js closeWrapper invoked');
  }
}


const socket = io();
send = (viewerId, message) => {
  console.log('broadcaster send viewerId', viewerId);
  socket.emit('signal', viewerId, message);
  // sender(viewerId, message);
}
socket.on('connect', () => {
  console.log('broadcaster socket connected', socket.id);

  socket.on('initiateConnection', (viewerId) => {
    console.log('viewer ', viewerId, ' wants to connect');
    var newPC = new ConspectioBroadcaster(viewerId);
    console.log('broadcast newPC', newPC);
    connections[viewerId] = newPC;
    newPC.init();
    newPC.createOfferWrapper();
  });

  socket.on('signal', (fromId, message) => {
    var currentPC = connections[fromId];
    if(message.type === 'answer') {
      currentPC.receiveAnswer(message.answer);
    } else if (message.type === 'candidate') {
      currentPC.addCandidate(message.candidate);
    }
  });

  // sender = (viewerId, message) => {
  //   socket.emit('signal', viewerId, message);
  // }

});

sendEventTag = () => {
  let eventTag = $('#eventTag').val();

  if(eventTag.length) {
    $('#startButton').prop('disabled', true);
    $('#stopButton').prop('disabled', false);
    socket.emit('sendEventTag', eventTag);

    var video = $('#broadcastStream')[0];
     
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
     
    if (navigator.getUserMedia) {       
        navigator.getUserMedia({video: true, audio: true}, handleVideo, videoError);
    }
     
    function handleVideo(stream) {
      let eventTag = $('#eventTag').val();
      globalStream = stream;
      video.src = window.URL.createObjectURL(stream);
      video.muted = true;
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
  //stops audio
  var audioTrack = globalStream.getAudioTracks();
  if (audioTrack.length) {
    globalStream.removeTrack(audioTrack[0]);
  }
  //stops video
  globalStream.getTracks()[0].stop();

  let eventTag = $('#eventTag').val();
  $('#startButton').prop('disabled', false);
  $('#stopButton').prop('disabled', true);
  for (var conspectioBroadcasterId in connections){
    connections[conspectioBroadcasterId].removeStreamWrapper();
    connections[conspectioBroadcasterId].closeWrapper();
    delete connections[conspectioBroadcasterId];
  }
  socket.emit('removeBroadcaster', eventTag);
};

// this doesn't work yet. attempted to handle when broadcasters exit browser.
// window.addEventListener('beforeunload', function(event) {
//   event.preventDefault();
//   console.log('beforeunload event:',event);
//   console.log('broadcaster browser closed…');
//   let eventTag = $('#eventTag').val();
//   for (var conspectioBroadcasterId in connections){
//     connections[conspectioBroadcasterId].removeStreamWrapper();
//     connections[conspectioBroadcasterId].closeWrapper();
//     delete connections[conspectioBroadcasterId];
//   }
//   socket.emit('removeBroadcaster', eventTag);
// });
