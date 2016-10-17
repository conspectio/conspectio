class ConspectioManager {
  init(callback) {
    // emit message to server
    conspectio.socket.emit('getEventList');

    // listener for receiving events list
    conspectio.socket.on('sendEventList', (eventList) => {
      console.log('EVENT LIST:', eventList);
      callback(eventList);
    });
  }
}

module.exports = ConspectioManager;