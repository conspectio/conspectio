var globalStream;
var broadcasterPeer;

const socket = io();
socket.on('connect', () => {
  console.log('broadcaster socket connected', socket.id);
  
  socket.on('initiateConnection', (viewerId) => {
    console.log('viewer ', viewerId, ' wants to connect');

    if(broadcasterPeer === undefined) {
      // instantiate broadcasterPeer as initiator
      broadcasterPeer = new SimplePeer({initiator: true, stream: globalStream});

      broadcasterPeer.on('signal', (data) => {
        console.log('broadcasterPeer on signal');

        // emit message to server to pass on to viewer
        socket.emit('signal', viewerId, {peerId: socket.id, data: data});

      });

      broadcasterPeer.on('error', function(e) {
        console.log('Inside broadcaster, Error sending connection:', e);
      });

      broadcasterPeer.on('connect', function () {
        console.log('broadcasterPeer connect');
        //broadcasterPeer.send('hey viewer, how is it going?')
      });
    }
  });

  socket.on('signal', (peerObj) => {
    if(broadcasterPeer) {
      console.log('broadcasterPeer receiving signal');
      broadcasterPeer.signal(peerObj.data);
    }  
  });



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
        navigator.getUserMedia({video: true, audio: false}, handleVideo, videoError);
    }
     
    function handleVideo(stream) {
      let eventTag = $('#eventTag').val();
      globalStream = stream;
      video.src = window.URL.createObjectURL(stream);
      // var broadcastURL = window.URL.createObjectURL(stream);
      // console.log('FIRSTBLOB', broadcastURL);
      // socket.emit('storeBroadcastURL', broadcastURL, eventTag);
      // var peerBroadcaster = new SimplePeer({
      //   initiator: true,
      //   stream: stream
      // });
      // peerBroadcaster.on('')
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


