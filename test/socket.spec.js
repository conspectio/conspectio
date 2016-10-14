const chai = require('chai');
const mocha = require('mocha');
const should = chai.should();

const PORT = require('../server/server');
const url = `http://localhost:${PORT}`;

const io = require('socket.io-client');
// const ioServer = require('socket.io').listen(PORT);

describe('Socket.io test', () => {
  let socket;
  let options = {
    transports: ['websocket'],
    'reconnection delay': 0,
    'reopen delay' : 0,
    'force new connection': true
  };

  beforeEach( (done) => {
    socket = io.connect(url, options);
    done();
  });
  //server <--> socket testing
  it('check if socket is connected', (done) => {
    socket.on('connect', () => {
      socket.on('echo', (msg) => {
        msg.should.equal("server side socket!");

        socket.disconnect();
        done();
      });
    });
  });

});

