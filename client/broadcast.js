const socket = io();
socket.on('connect', () => {
  console.log('broadcaster socket connected', socket.id);
  
});

sendEventTag = () => {
  let eventTag = $('#eventTag').val();
  $('#startButton').prop('disabled', true);
  $('#stopButton').prop('disabled', false);
  socket.emit('sendEventTag', eventTag);
};

stopStream = () => {
  let eventTag = $('#eventTag').val();
  $('#startButton').prop('disabled', false);
  $('#stopButton').prop('disabled', true);
  socket.emit('removeBroadcaster', eventTag);
};