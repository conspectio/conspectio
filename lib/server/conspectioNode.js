'use strict';

// class ConspectioNode {
//   constructor(socketId, eventId) {
//     this.socketId = socketId;
//     this.eventId = eventId;
//     this.origin = '';
//     this.source = '';
//     this.degree = 0;
//     this.leechers = [];
//   }
// }

function ConspectioNode(socketId, eventId) {
    this.socketId = socketId;
    this.eventId = eventId;
    this.origin = '';
    this.source = '';
    this.degree = 0;
    this.leechers = [];

}

module.exports = ConspectioNode;

