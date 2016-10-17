// load the conspectio library object unto the window object
if(! window.conspectio) {
  const conspectio = {};

  // require in webrtc-adapter for shimming
  require('webrtc-adapter');

  // require in socket.io-client
  const io = require('socket.io-client');

  // instantiate socket
  conspectio.socket = io();

  // the connections object holds multiple ConspectioConnection objects
  conspectio.connections = {};

  // import the ConspectioConnection module
  conspectio.ConspectioConnection = require('./conspectioConnection');

  // import the ConspectioManager module
  conspectio.ConspectioManager = require('./conspectioManager');

  window.conspectio = conspectio;
} else {
  console.log('Unable to load conspectio library');
}
