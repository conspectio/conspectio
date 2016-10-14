const chai = require('chai');
const mocha = require('mocha');
const should = chai.should();

const PORT = require('../server/server').PORT;
const url = `http://localhost:${PORT}`;

const io = require('socket.io-client');
const io_server = require('../server/server').io;

//connect to the IO instance after defining the listener, so you have define it in the scope outside of the before each step, and then just connect in the beforeEach.

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
    socket.on('connect', () => {
      console.log('socket connected testing');
      done();
    });
    socket.on('disconnect', () => {
      console.log('socket disconnect testing');
    });
    // done();
  });

  afterEach( (done) => {
    if(socket.connected) {
      console.log('disconnecting');
      socket.disconnect();
    } 
    io_server.close();
    done();
  });

  it('sockets should communicate', (done) => {
    io_server.emit('echotest1', 'Hello World');

    socket.on('echotest1', (msg) => {
      msg.should.equal('Hello World');
      done();
    });

    io_server.on('connection', (socket) => {
      socket.sould.to.not.be.null;
    });
  });
});

