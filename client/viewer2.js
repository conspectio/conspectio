//refactored viewer.js to a class constructor
var eventTag = window.location.search.substring(5);
$('#eventName').html(eventTag);

var connections = {};

class ConspectioViewer {
  constructor(broadcasterId) {
    this.broadcasterId = broadcasterId;
    this.pc; 
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
        },
        {
          url: 'turn:192.158.29.39:3478?transport=udp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
        },
        {
          url: 'turn:192.158.29.39:3478?transport=tcp',
          credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
          username: '28224511:1379330808'
        }
      ]
    });
    // this.pc = new RTCPeerConnection(null);
    this.pc.broadcasterId = this.broadcasterId;
    this.pc.onicecandidate = this.handleIceCandidate;
    this.pc.onaddstream = this.handleRemoteStreamAdded;
    this.pc.onremovestream = this.handleRemoteStreamRemoved;
    this.pc.oniceconnectionstatechange = this.handleIceConnectionChange;
  }

  handleIceCandidate(event) {
    console.log('handleIceCandidate event: ', event);
    if(event.candidate) {
      send(this.broadcasterId, {
        type: "candidate",
        candidate: event.candidate
      });
    }
  }

  handleRemoteStreamAdded(event) {
    console.log('got a stream from broadcaster');
    // got remote video stream, now let's show it in a video tag
    var video = $('<video class="newVideo"></video>').attr(
      {
        'src': window.URL.createObjectURL(event.stream),
        'autoplay': true,
        'id': this.broadcasterId.slice(2)
      });
    $('#videosDiv').append(video);
  }

  handleRemoteStreamRemoved(event) {
    console.log('broadcaster stream removed');
    //remove stream video tag

    $('#' + this.broadcasterId).remove();
  }

  handleIceConnectionChange() {
    if(this.pc) {
      console.log('inside handleIceCandidateDisconnect', this.pc.iceConnectionState);
      if(this.pc.iceConnectionState === 'disconnected') {
        console.log('inside pc.onIceConnectionState')
        this.pc.close();
        delete connections[this.broadcasterId];
      }
    }
  }

  receiveOffer(offer) {
    this.pc.setRemoteDescription(new RTCSessionDescription(offer));
  }

  createAnswerWrapper() {
    this.pc.createAnswer( (answer) => {
      this.pc.setLocalDescription(new RTCSessionDescription(answer));

      send(this.broadcasterId, {
        type: "answer",
        answer: answer
      });
    }, (error) => {
      console.log('Error with creating viewer offer', error);
    });
  }

  addCandidate(candidate) {
    this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
  
  closeWrapper() {
    this.pc.close();
    //remove stream video tag
    $('#' + this.broadcasterId.slice(2)).remove();
    console.log('broadcaster stream removed from closewrapper');
  }
}

const socket = io();

send = (broadcasterId, message) => {
  console.log('viewer send broadcasterId', broadcasterId);
  socket.emit('signal', broadcasterId, message);
}

socket.on('connect', () => {
  console.log('viewer socket connected', socket.id);

  // view wants to initiate contact with broadcaster
  socket.emit('initiateView', eventTag);

  socket.on('signal', (fromId, message) => {
    if(message.type === 'offer') {
      var newPC = new ConspectioViewer(fromId);
      connections[fromId] = newPC;
      newPC.init();
      newPC.receiveOffer(message.offer);
      newPC.createAnswerWrapper();
    } else if (message.type === 'candidate') {
      if (connections[fromId]){
        var currentPC = connections[fromId];
        currentPC.addCandidate(message.candidate);
      }
    }
  });

    //redirect viewer to events page if there are no more broadcasters streaming their event
  socket.on('redirectToEvents', (destination) => {
    console.log('redirecting viewer to events page');
    window.location.href = destination;
  });

  //broadcaster left - close connection & remove from connections object
  socket.on('broadcasterLeft', (broadcasterId) => {
    if (connections[broadcasterId]){
      connections[broadcasterId].closeWrapper();
      delete connections[broadcasterId];
    }
  })

});