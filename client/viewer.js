var eventTag = window.location.search.substring(5);
$('#eventName').html(eventTag);

var pc;
var currBroadcasterId;
var globalStream;

const socket = io();
socket.on('connect', () => {
  console.log('viewer socket connected', socket.id);

  // view wants to initiate contact with broadcaster
  socket.emit('initiateView', eventTag);

  socket.on('signal', (fromId, message) => {
    currBroadcasterId = fromId;

    // interpret message
    if(message.type === 'offer') {
      createPeerConnection();
      pc.setRemoteDescription(new RTCSessionDescription(message.offer));
      pc.createAnswer((answer) => {
        pc.setLocalDescription(new RTCSessionDescription(answer));

        send({
          type: "answer",
          answer: answer
        });
      }, (error) => {
        console.log('Error with creating viewer offer', error);
      });
    } else if(message.type === 'candidate') {
      pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  });
   
  //redirect viewer to events page if there are no more broadcasters streaming their event
  socket.on('redirectToEvents', (destination) => {
    console.log('redirecting viewer to events page');
    window.location.href = destination;
  });
  
});

createPeerConnection = () => {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    pc.oniceconnectionstatechange = handleIceConnectionChange;
  } catch(e) {
    console.log('Failed to create RTCPeerConnetion: ', e.message);
    return;
  }
};

send = (message) => {
  if(currBroadcasterId) {
    socket.emit('signal', currBroadcasterId, message);
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

handleRemoteStreamAdded = (event) => {
  console.log('got a stream from broadcaster');
  // got remote video stream, now let's show it in a video tag
  var video = $('<video class="newVideo"></video>').attr(
    {
      'src': window.URL.createObjectURL(event.stream),
      'autoplay': true
    });
  $('#videosDiv').append(video);
  // globalStream = event.stream;
  //video.play();
};

handleRemoteStreamRemoved = (event) => {
  console.log('broadcaster stream removed');
};