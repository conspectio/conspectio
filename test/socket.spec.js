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
  //server <--> socket testing
  it('echos msg', (done) => {
    let client = io.connect("http://localhost:3000", options);

    client.on('connect', () => {
      client.on('echo', (msg) => {
        console.log("message", msg)
        msg.should.equal("server side socket!");

        client.disconnect();
        done();
      });

    });
  });

});

