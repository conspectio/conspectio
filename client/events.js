const socket = io();
socket.on('connect', () => {
  console.log('viewer socket connected', socket.id);
  socket.emit('getEventList');

  socket.on('sendEventList', (eventList) => {
  	console.log('EVENT LIST:', eventList);
    displayEventList(eventList);
  });
});


displayEventList = (eventList) => {
  console.log('inside displayEventList');
  $('#eventList').append('<ul>');
  eventList.forEach((event) => {
    $('#eventList').append(`<li><a href = 'viewer.html?tag=${event}'>${event}</a></li>`);
  });
	$('#eventList').append('</ul>');
};