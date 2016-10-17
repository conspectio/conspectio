// setup viewer.html dom and event handlers
function setupViewerDom() {
  const parentElement = $('#conspectioViewerContainer').addClass('row viewergridrow');

  // setup the eventName DOM element and populate with url query value
  const eventName = $('<h1></h1>').attr(
    {
      'id': 'eventName'
    }
  );

  parentElement.append(eventName);

  const eventTag = window.location.search.substring(5);
  $('#eventName').html(eventTag);

  const videosDiv = $('<div></div>').attr(
    {
      'id': 'videosDiv'
    }
  );

  parentElement.append(videosDiv);

  return eventTag;
}

function handleNoMoreBroadcasters() {
  const destination = './events.html';
  console.log('redirecting viewer to events page');
  window.location.href = destination;
}

function handleBroadcasterAdded(newVideo) {
  console.log('handleBroadcasterAdded invoked, newVideo', newVideo);

  const responsiveGrid = $('<div class = "col-xs-6"></div>');
  const videoDiv = $('<div class="videoDiv"></div>').append(newVideo);
  // const videoDivVideo = videoDiv.append(newVideo);
  const responsiveGridvideoDivVideo = responsiveGrid.append(videoDiv);

  const viewerVideosDivId = '#' + 'conspectioViewerContainer';
  $(viewerVideosDivId).append(responsiveGridvideoDivVideo);
}

function handleBroadcasterRemoved(videoDivId) {
    //remove stream video tag
    $('#' + videoDivId).remove();
    console.log('broadcaster stream removed from closewrapper');
}

const eventTag = setupViewerDom();
const viewerHandlers = {
  noMoreBroadcasters: handleNoMoreBroadcasters,
  broadcasterAdded: handleBroadcasterAdded,
  broadcasterRemoved: handleBroadcasterRemoved
};
// expected args - eventId, role, domId, viewerHandlers, RTCPeerConnection options
var conspectioConnectionObj = new conspectio.ConspectioConnection(eventTag, 'viewer', 'conspectioViewerContainer', viewerHandlers, null);
conspectioConnectionObj.start();



