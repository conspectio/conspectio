//***UX#1 - auto update events list if a new event gets added while a viewer is on events.html - currently not functioning
//var viewersDeciding = {};

const socket = io();
socket.on('connect', () => {
  //***UX#1 - auto update events list if a new event gets added while a viewer is on events.html - currently not functioning
    // viewersDeciding[socket.id] = socket.id;
    // console.log('event socket connected', socket.id);
    // console.log('viewersDeciding:', viewersDeciding);
    socket.emit('getEventList');

  socket.on('sendEventList', (eventList) => {
  	console.log('EVENT LIST:', eventList);
    displayEventList(eventList);
  });

  // ***UX#1: 
  // socket.on('newEventAdded', (eventList) => {
  //   console.log('events.js new event added, reload page BEFORE');
  //   location.reload();
  //   console.log('events.js new event added, reload page AFTER');
  //   // displayEventList(eventList);
  // });
});


displayEventList = (eventList) => {
  console.log('inside displayEventList');
  $('#eventList').empty();
  $('#eventList').append('<ul>');
  eventList.forEach((event) => {
    $('#eventList').append(`<li><a href = 'viewer.html?tag=${event}'>${event}</a></li>`);
  });
	$('#eventList').append('</ul>');
};