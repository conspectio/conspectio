// require in jquery
const $ = require("jquery");

const setupGetUserMedia = (domId, callback) => {

  // retrieve getUserMedia
  navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia);
    



    //uses rear facing camera by default if one is available
    navigator.mediaDevices.enumerateDevices()
      .then(function(devices){

        var videoList = [];
        var videoSource;
        var option = document.createElement('option');
        
        for (var i = 0; i < devices.length; i++){
          if (devices[i].kind === 'videoinput'){
            videoList.push(devices[i].deviceId);
            if(devices[i].kind.length > 1){
              videoSource = videoList[1];
            } else {
              videoSource = videoList[0];
            }
          }
        }
        if (navigator.getUserMedia) {       
          navigator.getUserMedia({video: {deviceId: videoSource ? {exact: videoSource} : undefined}, audio: true}, handleVideo, videoError);
        }
      })
      .catch(function(err){console.log('Error in retrieving MediaDevices:', err);});



  // if (navigator.getUserMedia) {       
  //   navigator.getUserMedia({video: true, audio: true}, handleVideo, videoError);
  // }

  function handleVideo(stream) {
    // grab the broadcasterStream dom element and set the src
    const broadcasterStreamId = '#' + domId;
    const broadcasterStream = $(broadcasterStreamId)[0];
    broadcasterStream.src = window.URL.createObjectURL(stream);

    // invoke callback - which will call broadcasterRTCEndpoint(stream)
    callback(stream);
  }

  function videoError(e) {
      // log video error
      console.log('Unable to get stream from getUserMedia', e);
  }

};

module.exports = setupGetUserMedia;