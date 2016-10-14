const path = require('path');
const fs = require('fs');
const chai = require('chai');
const request = require('supertest');

const expect = chai.expect;

const HOST = 'http://localhost:3001';

require('../server/server');

describe('Server routes', function() {
  describe('GET request to /', function() {
    it('should respond with a status of 200', function(done) {
      request(HOST)
        .get('/')
        .expect('Content-Type', /text\/html/)
        .expect(200, done);
    });

    it('should respond with index.html file', function(done) {
      request(HOST) 
        .get('/')
        .expect( function(response) {
          const indexFile = fs.readFileSync(path.join(__dirname, '../', 'client', 'index.html'));
          expect(indexFile.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });
  });

});