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

describe('test one broadcaster and two viewers', function(){
  let broadcaster, viewer1, viewer2;
  beforeEach(function(){
    broadcaster = coldbrew.createClient();
    viewer1 = coldbrew.createClient();
    viewer2 = coldbrew.createClient();
  });

  it('should display the first broadcaster stream to two viewers', function(done){
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

    viewer1.get(address);
    viewer1.findElementByAttributes('button', {innerText: 'Watch'}).click();
    viewer1.wait(until.elementLocated(By.css('li a')));
    viewer1.findElementByAttributes('li a').click();
    viewer1.executeScript(function(){
      return Object.keys(window.conspectio.connections);
    }).then(function(arrOfCompositeKeys){
      return viewer1.waitUntilRTCEvents(['addstream'], {inOrder: true, label: arrOfCompositeKeys[0]}, 20000);  
    });

    viewer2.get(address);
    viewer2.findElementByAttributes('button', {innerText: 'Watch'}).click();
    viewer2.wait(until.elementLocated(By.css('li a')));
    viewer2.findElementByAttributes('li a').click();
    viewer2.executeScript(function(){
      return Object.keys(window.conspectio.connections);
    }).then(function(arrOfCompositeKeys){
      return viewer2.waitUntilRTCEvents(['addstream'], {inOrder: true, label: arrOfCompositeKeys[0]}, 20000);  
    });

    viewer1.executeScript(function(){
      return Object.keys(window.conspectio.connections);
    }).then(function(arrOfCompositeKeys){
      expect(arrOfCompositeKeys).to.have.length(2);
      done();
    })

  });

  afterEach(function(done){
    broadcaster.quit();
    viewer1.quit();
    viewer2.quit().then(function(){
      done();
    });
  });
});

describe('drop one viewer with a leecher and leecher should still get broadcaster stream', function(){
  let broadcaster, viewer1, viewer2;
  beforeEach(function(){
    broadcaster = coldbrew.createClient();
    viewer1 = coldbrew.createClient();
    viewer2 = coldbrew.createClient();
  });

  it('should display the same media stream id when viewer is reconnected', function(done){
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

    viewer1.get(address);
    viewer1.findElementByAttributes('button', {innerText: 'Watch'}).click();
    viewer1.wait(until.elementLocated(By.css('li a')));
    viewer1.findElementByAttributes('li a').click();

    viewer2.get(address);
    viewer2.findElementByAttributes('button', {innerText: 'Watch'}).click();
    viewer2.wait(until.elementLocated(By.css('li a')));
    viewer2.findElementByAttributes('li a').click();
    
    viewer1.findElementByAttributes('button', {innerText: 'Leave Room'}).click();
    viewer2.wait(function(){
      return viewer2.executeScript(function(){
        let numOfAddStreamEvents = 0;
        for (var i = 0; i < window.coldBrewData.RTCEvents.length; i++){
          if (window.coldBrewData.RTCEvents[i].type === 'addstream'){
            numOfAddStreamEvents++;
          }
        }
        return numOfAddStreamEvents === 2;
      });
    }).then(function(occurred){
      if(occurred){
        done();
      }
    });
  });

  afterEach(function(done){
    broadcaster.quit();
    viewer1.quit();
    viewer2.quit().then(function(){
      done();
    });
  });


});




////~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~stuff below may not work

// /////////*********
// describe('drop one viewer with a leecher and leecher should still get broadcaster stream', function(){
//   let broadcaster, viewer1, viewer2;
//   beforeEach(function(){
//     broadcaster = coldbrew.createClient();
//     viewer1 = coldbrew.createClient();
//     viewer2 = coldbrew.createClient();
//   });

//   it('should display the same media stream id when viewer is reconnected', function(done){
//     broadcaster.get(address);
//     broadcaster.findElementByAttributes('button', {innerText: 'Broadcast'}).click();
//     broadcaster.wait(until.elementLocated(By.css('video')));
//     broadcaster.do([
//       ['sendKeys', '#eventTag', {}, 'demo'],
//       ['click', '#startButton']
//     ]);
//     broadcaster.wait(function(){
//       return broadcaster.executeScript(function(){
//         return !!document.getElementById('broadcasterStream').src;
//       });
//     });

//     // let mediaStreamId;
//     viewer1.get(address);
//     viewer1.findElementByAttributes('button', {innerText: 'Watch'}).click();
//     viewer1.wait(until.elementLocated(By.css('li a')));
//     viewer1.findElementByAttributes('li a').click();

//     viewer2.get(address);
//     viewer2.findElementByAttributes('button', {innerText: 'Watch'}).click();
//     viewer2.wait(until.elementLocated(By.css('li a')));
//     viewer2.findElementByAttributes('li a').click();

//     viewer1.findElementByAttributes('button', {innerText: 'Leave Room'}).click();


   
//     // viewer2.executeScript(function(){
//     //   return Object.keys(window.conspectio.connections);
//     // }).then(function(arrOfCompositeKeys){
//     //   return viewer2.waitUntilRTCEvents(['addstream'], {inOrder: true, label: arrOfCompositeKeys[0]}, 20000);  
//     // });

    
    
//     viewer2.wait(function(){
//       return viewer2.executeScript(function(){
//         let numOfAddStreamEvents = 0;
//         for (var i = 0; i < window.coldBrewData.RTCEvents.length; i++){
//           if (window.coldBrewData.RTCEvents[i].type === 'addstream'){
//             numOfAddStreamEvents++;
//           }
//         }
//         return numOfAddStreamEvents === 2;
//       });
//     }).then(function(occurred){
//       if(occurred){
//         done();
//       }
//     });
//   });

  

//   afterEach(function(done){
//     broadcaster.quit();
//     viewer1.quit();
//     viewer2.quit().then(function(){
//       done();
//     });
//   });

// });

// describe('should display 2 broadcaster streams to 1 viewer', function(){
//   let broadcaster, broadcaster2, viewer1;
//   beforeEach(function(){
//     broadcaster = coldbrew.createClient();
//     broadcaster2 = coldbrew.createClient();
//     viewer1 = coldbrew.createClient();
//     // viewer2 = coldbrew.createClient();
//   });


//   it('should display 1 stream to 1 viewer, have another broadcaster sign on, then display the second broadcaster stream to the viewer', function(done){
//     broadcaster.get(address);
//     broadcaster.findElementByAttributes('button', {innerText: 'Broadcast'}).click();
//     broadcaster.wait(until.elementLocated(By.css('video')));
//     broadcaster.do([
//       ['sendKeys', '#eventTag', {}, 'demo'],
//       ['click', '#startButton']
//     ]);
//     broadcaster.wait(function(){
//       return broadcaster.executeScript(function(){
//         return !!document.getElementById('broadcasterStream').src;
//       });
//     });

//     viewer1.get(address);
//     viewer1.findElementByAttributes('button', {innerText: 'Watch'}).click();
//     viewer1.wait(until.elementLocated(By.css('li a')));
//     viewer1.findElementByAttributes('li a').click();

//     let mediaStreamId1;
//     viewer1.executeScript(function(){
//       for (var i = 0; i < window.coldBrewData.RTCEvents.length; i++){
//         if (window.coldBrewData.RTCEvents[i].type === 'addstream'){
//           return window.coldBrewData.RTCEvents[i].stream.id;
//         }
//       }
//     }).then(function(streamId){
//       mediaStreamId1 = streamId;
//     });


//     broadcaster2.get(address);
//     broadcaster2.findElementByAttributes('button', {innerText: 'Broadcast'}).click();
//     broadcaster2.wait(until.elementLocated(By.css('video')));
//     broadcaster2.do([
//       ['sendKeys', '#eventTag', {}, 'demo'],
//       ['click', '#startButton']
//     ]);
//     broadcaster2.wait(function(){
//       return broadcaster2.executeScript(function(){
//         return !!document.getElementById('broadcasterStream').src;
//       });
//     });

//     // viewer1.wait(function(){
//     //   return viewer1.executeScript(function(){
//     //     let streamsObj = {};
//     //     for (var i = 0; i < window.coldBrewData.RTCEvents.length; i++){
//     //       if (window.coldBrewData.RTCEvents[i].type === 'addstream'){
//     //         streamsObj[window.coldBrewData.RTCEvents[i].stream.id] = true;
//     //       }
//     //     }
//     //     return streamsObj;
//     //   }).then(function(streamsObj){
//     //     expect(Object.keys(streamsObj).length).to.equal(2);
//     //     done();
//     //   });
//     // });

//     viewer1.wait(function(){
//       return viewer1.executeScript(function(){
//         let numOfAddStreamEvents = 0;
//         for (var i = 0; i < window.coldBrewData.RTCEvents.length; i++){
//           if (window.coldBrewData.RTCEvents[i].type === 'addstream'){
//             numOfAddStreamEvents++;
//           }
//         }
//         return numOfAddStreamEvents === 2;
//       });
//     }).then(function(occurred){
//       if(occurred){
//         done();
//       }
//     });

//     // viewer2.wait(function(){
//     //   return viewer2.executeScript(function(){
//     //     let numOfAddStreamEvents = 0;
//     //     for (var i = 0; i < window.coldBrewData.RTCEvents.length; i++){
//     //       if (window.coldBrewData.RTCEvents[i].type === 'addstream'){
//     //         numOfAddStreamEvents++;
//     //       }
//     //     }
//     //     return numOfAddStreamEvents === 2;
//     //   });
//     // });


//   });

//   afterEach(function(done){
//     broadcaster.quit();
//     broadcaster2.quit();
//     viewer1.quit().then(function(){
//       done();
//     });
//   });


// });

// //////
//     // viewer1.executeScript(function(){
//     //   for (var i = 0; i < window.coldBrewData.RTCEvents.length; i++){
//     //     if (window.coldBrewData.RTCEvents[i].type === 'addstream'){
//     //       return window.coldBrewData.RTCEvents[i].stream.id;
//     //     }
//     //   }
//     // }).then(function(streamId){
//     //   mediaStreamId = streamId;
//     // });
//   //////

//   ////////**********