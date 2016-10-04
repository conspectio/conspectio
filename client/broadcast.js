var socket = io();
socket.on('connect', function(){
  console.log('broadcaster socket connected', socket.id);
});

