class ConspectioManager {
  init(callback) {
    // emit message to server
    conspectio.socket.emit('getEventList');

    // listener for receiving events list
    conspectio.socket.on('sendEventList', (eventList) => {
      callback(eventList);
    });
  }
}

module.exports = ConspectioManager;