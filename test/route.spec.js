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

  describe('request to /broadcast', function() {
    it('should respond with the broadcast.html file', function(done) {
      request(HOST)
        .get('/broadcast.html')
        .expect( function(response) {
          const broadcastHtml = fs.readFileSync(path.join(__dirname, '../', 'client', 'broadcast.html'));
          expect(broadcastHtml.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });

    it('should respond with the broadcast2.js file', function(done) {
      request(HOST)
        .get('/broadcast2.js')
        .expect( function(response) {
          const broadcastJs = fs.readFileSync(path.join(__dirname, '../', 'client', 'broadcast2.js'));
          expect(broadcastJs.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });
  });

  describe('request to /events', function() {
    it('should respond with the event.html file', function(done) {
      request(HOST)
        .get('/events.html')
        .expect( function(response) {
          const broadcastHtml = fs.readFileSync(path.join(__dirname, '../', 'client', 'events.html'));
          expect(broadcastHtml.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });

    it('should respond with the events.js file', function(done) {
      request(HOST)
        .get('/events.js')
        .expect( function(response) {
          const eventsJs = fs.readFileSync(path.join(__dirname, '../', 'client', 'events.js'));
          expect(eventsJs.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });
  });

  describe('request to /viewer', function() {
    it('should respond with the viewer.html file', function(done) {
      request(HOST)
        .get('/viewer.html')
        .expect( function(response) {
          const viewerHtml = fs.readFileSync(path.join(__dirname, '../', 'client', 'viewer.html'));
          expect(viewerHtml.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });

    it('should respond with the viewer2.js file', function(done) {
      request(HOST)
        .get('/viewer2.js')
        .expect( function(response) {
          const viewerJs = fs.readFileSync(path.join(__dirname, '../', 'client', 'viewer2.js'));
          expect(viewerJs.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });
  });

  describe('request to a sampleEvent', function() {
    it('should respond with the viewer.html file with sampleEvent', function(done) {
      request(HOST)
        .get('/viewer.html?tag=sampleEvent')
        .expect( function(response) {
          const viewerHtml = fs.readFileSync(path.join(__dirname, '../', 'client', 'viewer.html'));
          expect(viewerHtml.toString()).to.equal(response.text);
        })
        .expect(200, done);
    });
  });

  describe('GET request to an invalid route', function() {
    it('should respond with a status of 404', function(done) {
      request(HOST)
      .get('/bad')
      .expect(404, done);
    });
  });
});