var eventTag = window.location.search.substring(5);
$('#eventName').html(eventTag);

// var peerViewer = new SimplePeer();

// peerBroadcaster.on('signal', function (data) {

//   peer2.signal(data)
// });
// peerViewer.on('stream', function (stream) {
//   var video = document.createElement('video')
//   video.src = window.URL.createObjectURL(stream)
//   document.body.appendChild(video)
//   video.play()
// });


const socket = io();
socket.on('connect', () => {
  console.log('viewer socket connected', socket.id);
  socket.emit('getBroadcastURL', eventTag);

  socket.on('sendBroadcastURL', (broadcastURL) => {
    var video = document.createElement('video');
    console.log('BROADCASTURL:', broadcastURL);
    video.src = broadcastURL;
    document.body.appendChild(video);
    video.play();
  });
});