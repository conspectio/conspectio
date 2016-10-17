// setup for broadcaster - setup dom with event handlers

var conspectioConnectionObj;

function sendEventTag() {
  console.log('sendEventTag invoked');
  const eventTag = $('#eventTag').val();

  if(eventTag.length) {
    $('#startButton').prop('disabled', true);
    $('#stopButton').prop('disabled', false);

    // required args: eventId, role, domId, viewHandler, RTCPeerConnection options
    conspectioConnectionObj = new conspectio.ConspectioConnection(eventTag, 'broadcaster', 'broadcasterStream', null, null);
    conspectioConnectionObj.start();
  } else {
    alert('please enter a tag name to start streaming');
  }
};

function stopStream() {
  console.log('stopStream invoked');

  $('#startButton').prop('disabled', false);
  $('#stopButton').prop('disabled', true);

  $('#broadcastMsg').empty();
  $('#broadcastMsg').html(`<p>You have stopped streaming</p>`);

  conspectioConnectionObj.stop();
};

$('#startButton').on('click', sendEventTag);
$('#stopButton').on('click', stopStream); 