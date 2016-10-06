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

var viewerPeer;
const socket = io();
socket.on('connect', () => {
  console.log('viewer socket connected', socket.id);

  // view wants to initiate contact with broadcaster
  socket.emit('initiateView', eventTag);

  socket.on('signal', (peerObj) => {
    console.log('viewer receiving signal', peerObj);

    // instantiate viewerPeer
    if(viewerPeer === undefined) {
      console.log('inside viewerPeer instantiate', peerObj);
      var broadcasterId = '/#' + peerObj.peerId;
      viewerPeer = new SimplePeer({initiator: false});
      viewerPeer.signal(peerObj.data);

      viewerPeer.on('signal', (data) => {
        console.log('viewerPeer on signal', data);

        // emit message to server to pass on to broadcaster
        socket.emit('signal', broadcasterId, {peerId: socket.id, data: data});
      });

      viewerPeer.on('error', function(e) {
        console.log('inside viewer, Error sending connection:', e);
      });

      viewerPeer.on('connect', function () {
        console.log('viewerPeer connect');
        //broadcasterPeer.send('hey viewer, how is it going?')
      });

      viewerPeer.on('stream', function (stream) {
        console.log('got a stream from broadcaster');
        // got remote video stream, now let's show it in a video tag
        var video = $('#broadcast1')[0];
        video.src = window.URL.createObjectURL(stream)
        video.play()
      })

      // viewerPeer.on('data', (msg) => {
      //   console.log('got a message from broadcaster: ' + msg);
      // });
    }
   
  //redirect viewer to events page if there are no more broadcasters streaming their event
  socket.on('redirectToEvents', (destination) => {
    console.log('redirecting viewer to events page');
    window.location.href = destination;
  });

    // var viewerPeer = new SimplePeer({initiator: false});

    // viewerPeer.on('signal', (data) => {
    //   console.log('viewerPeer on signal');

    //   // emit message to server to pass on to broadcaster
    //   socket.emit('signal', peerObj.userId, {userId: socket.id, data: data});
    // });

    // viewerPeer.on('message', (msg) => {
    //   console.log('got a message from broadcaster: ' + msg);
    // });

    //viewerPeer.signal(peerObj.data);

    
  });

  // socket.emit('getBroadcastURL', eventTag);

  // socket.on('sendBroadcastURL', (broadcastURL) => {
  //   var video = document.createElement('video');
  //   console.log('BROADCASTURL:', broadcastURL);
  //   video.src = broadcastURL;
  //   document.body.appendChild(video);
  //   video.play();
  // });
});