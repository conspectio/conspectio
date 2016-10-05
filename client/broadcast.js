const socket = io();
socket.on('connect', () => {
  console.log('broadcaster socket connected', socket.id);
  
});

var globalStream;
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
      var broadcastURL = window.URL.createObjectURL(stream);
      console.log('FIRSTBLOB', broadcastURL);
      socket.emit('storeBroadcastURL', broadcastURL, eventTag);
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


