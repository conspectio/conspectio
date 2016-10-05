const chai = require('chai');
const mocha = require('mocha');
const should = chai.should();

const io = require('socket.io-client');

describe('echo', () => {

  let server;
  let options = {
    transports: ['websocket'],
    'force new connection': true
  };

  beforeEach( (done) => {
    //start the server
    server = require('../server/server');
    done();
  });

  it('echos msg', (done) => {
    let client = io.connect("http://localhost:3000", options);

    client.once('connect', () => {
      client.once('sendEventTag', () => {
        message.should.equal("Hello World");

        client.disconnect();
        done();
      });

      client.emit('sendEventTag', 'Hello World');
    });
  });

});

