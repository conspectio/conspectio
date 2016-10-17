// invoke to setup socket listeners and get list of active events
var conspectioManagerObj = new conspectio.ConspectioManager();

// call init() passing in callback function for handling displaying of events
conspectioManagerObj.init(displayEventList); 

function displayEventList(eventList) {
  console.log('inside displayEventList');
  $('#conspectioEventsContainer').empty();
  $('#conspectioEventsContainer').append('<ul>');
  eventList.forEach((event) => {
    $('#conspectioEventsContainer').append(`<li><a href='viewer.html?tag=${event}'><span class ='label label-default'>${event}</span></a></li>`);
  });
  $('#conspectioEventsContainer').append('</ul>');
};