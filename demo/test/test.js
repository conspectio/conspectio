const chai = require('chai');
const expect = chai.expect;
const coldbrew = require('cold-brew');
const server = require('./../server/server.js');
const address = 'http://localhost:3000';
const {until, By} = require('selenium-webdriver');

describe('demo app', function(){
	let client;
  beforeEach(function(){
    client = coldbrew.createClient();
  });

  it('should show two buttons - broadcast and watch', function(done){
    this.timeout(20000);
    client.get(address);
    client.findElementByAttributes('button', {innerText: 'Broadcast'}).click();
    client.wait(until.elementLocated(By.css('video')));
    // client.findElementByAttributes('#eventTag').sendKeys('demo');
    // client.findElementByAttributes('#startButton').click();
    client.do([
      ['sendKeys', '#eventTag', {}, 'demo'],
      ['click', '#startButton']
    ]);
    client.wait(function(){
      return client.executeScript(function(){
        return !!document.getElementById('broadcasterStream').src;
      });
    })
    .then(function(){
      done();
    });
  });

  afterEach(function(done){
    client.quit().then(function(){
      done();
    });
  });
});

describe('test two clients', function(){
  let broadcaster, viewer;
  beforeEach(function(){
    broadcaster = coldbrew.createClient();
    viewer = coldbrew.createClient();
  });

  it('should make sure the viewer sees the stream from the broadcaster', function(done){
    broadcaster.get(address);
    broadcaster.findElementByAttributes('button', {innerText: 'Broadcast'}).click();
    broadcaster.wait(until.elementLocated(By.css('video')));
    broadcaster.do([
      ['sendKeys', '#eventTag', {}, 'demo'],
      ['click', '#startButton']
    ]);
    broadcaster.wait(function(){
      return broadcaster.executeScript(function(){
        return !!document.getElementById('broadcasterStream').src;
      });
    });

    viewer.get(address);
    viewer.findElementByAttributes('button', {innerText: 'Watch'}).click();
    viewer.wait(until.elementLocated(By.css('li a')));
    viewer.findElementByAttributes('li a').click();
    viewer.executeScript(function(){
      return Object.keys(window.conspectio.connections);
    }).then(function(arrOfCompositeKeys){
      return viewer.waitUntilRTCEvents(['addstream'], {inOrder: true, label: arrOfCompositeKeys[0]}, 20000);  
    }).then(function(){
      done();
    });
  });

  afterEach(function(done){
    broadcaster.quit();
    viewer.quit().then(function(){
      done();
    });
  });
});