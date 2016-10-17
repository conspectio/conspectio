// generic send function to send message to recipient via socket
const send = (toId, message) => {
  console.log('toId', toId);
  conspectio.socket.emit('signal', toId, message);
}

module.exports = send;