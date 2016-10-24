// generic send function to send message to recipient via socket
const send = (toId, message, originId) => {
  console.log('toId', toId);
  conspectio.socket.emit('signal', toId, message, originId);
}

module.exports = send;