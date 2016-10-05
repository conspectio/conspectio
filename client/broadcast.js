const socket = io();
socket.on('connect', () => {
  console.log('broadcaster socket connected', socket.id);
  
});


window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

console.log('navigator', navigator, 'getusermedia', navigator.getUserMedia);
console.log('windowurl', window.URL);
var video1 = $('#broadcastStream');

if(navigator.getUserMedia) {
  navigator.getUserMedia({video: true, audio: false}, (stream) => {
    console.log('stream',stream);

    // var videoTracks = stream.getVideoTracks();
    // window.stream = stream;
    // video.srcObject = stream;
    video1.src = window.URL.createObjectURL(stream);
    console.log('videosrc', video1.src);
  }, (err) =>{
    if (err) alert('unable to access camera');
  });
}

sendEventTag = () => {
  let eventTag = $('#eventTag').val();

  if(eventTag.length) {
    $('#startButton').prop('disabled', true);
    $('#stopButton').prop('disabled', false);
    socket.emit('sendEventTag', eventTag);



    //shimming - grabs the appropriate getUserMedia depending on the browser
    // window.URL = window.URL || window.webkitURL;
    // navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    // console.log('navigator', navigator, 'getusermedia', navigator.getUserMedia);
    // console.log('windowurl', window.URL);
    // var video = $('#broadcastStream');

    // if(navigator.getUserMedia) {
    //   navigator.getUserMedia({video: true, audio: false}, (stream) => {
    //     console.log('stream',stream);

    //     // var videoTracks = stream.getVideoTracks();
    //     // window.stream = stream;
    //     // video.srcObject = stream;
    //     video.src = window.URL.createObjectURL(stream);
    //     console.log('videosrc', video.src);
    //   }, (err) =>{
    //     if (err) alert('unable to access camera');
    //   });
    // }
  } else {
    alert('please enter a tag name to start streaming');
  }
};

stopStream = () => {
  let eventTag = $('#eventTag').val();
  $('#startButton').prop('disabled', false);
  $('#stopButton').prop('disabled', true);
  socket.emit('removeBroadcaster', eventTag);
};


