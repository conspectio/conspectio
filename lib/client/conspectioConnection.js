const setupGetUserMedia = require('./setupGetUserMedia.js');
const broadcasterRTCEndpoint  = require('./broadcasterRTCEndpoint.js');
const viewerRTCEndpoint  = require('./viewerRTCEndpoint.js');

class ConspectioConnection {
  constructor(eventId, role, domId, viewerHandlers, options) {
    this.eventId = eventId;
    this.role = role;
    this.domId = domId;
    this.viewerHandlers = viewerHandlers;
    this.options = options;
    this.stream = null;
  }

  start() {
    if(this.role && this.role === 'broadcaster') {
      // reset conspectio.connections
      // conspectio.connections = {};

      // emit message to server
      conspectio.socket.emit('sendEventTag', this.eventId);

      const that = this;

      // invoke setupGetUserMedia - the callback function is invoked after success getUserMedia()
      setupGetUserMedia(this.domId, (stream) => {
        // store a reference of MediaStream in this object's stream property
        that.stream = stream;

        // setup broadcasterRTCEndpoint - passing in the MediaStream
        broadcasterRTCEndpoint(stream);
      });

    } else if(this.role && this.role === 'viewer') {
      // invoke viewerRTCEndpoint - setup appropriate socket events relating to webRTC connection
      viewerRTCEndpoint(this.eventId, this.viewerHandlers);
    }
  }

  stop() {

    if(this.role && this.role === 'broadcaster') {
      //stops audio
      this.stream.getTracks()[0].stop();

      //stops video
      this.stream.getTracks()[1].stop();

      // emit message to server
      conspectio.socket.emit('removeBroadcaster', this.eventId);
    } else if(this.role && this.role === 'viewer') {

    }

    // for each endpoint in connections{}, close it out
    for (var conspectioId in conspectio.connections){
      conspectio.connections[conspectioId].removeStreamWrapper();
      conspectio.connections[conspectioId].closeWrapper();
      delete conspectio.connections[conspectioId];
    }
  }

}

module.exports = ConspectioConnection;