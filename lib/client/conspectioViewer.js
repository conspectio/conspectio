// require in jquery
const $ = require("jquery");
const send = require('./send.js');

// custom wrapper class over RTCPeerConnection object
class ConspectioViewer {
  constructor(broadcasterId, viewerHandlers, originId) {
    this.broadcasterId = broadcasterId;
    this.viewerHandlers = viewerHandlers;
    this.pc;
    this.remoteStream;
    this.originId = originId;
  }

  init() {
    this.pc = new RTCPeerConnection({
      'iceServers': [
        {
          'url': 'stun:stun.l.google.com:19302'
        },
        {
          url: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com'
        }
      ]
    });
 
    this.pc.broadcasterId = this.broadcasterId; // add custom attribute
    this.pc.viewerHandlers = this.viewerHandlers; // add custom attribute
    this.pc.originId = this.originId; // add custom attribute
    var that = this;
    this.pc.setRemoteStream = (stream) => {
      that.remoteStream = stream;
      console.log('that.remoteStream====', that.remoteStream)
      //informs server to look up potential leechers of viewer that just received stream
      //broadcasterId represents socketId of source of the node emitting 'receivedStream'
      console.log('that.broadcasterId====', that.broadcasterId);
      console.log('that.originId====', that.originId)
      conspectio.socket.emit('receivedStream', that.broadcasterId, that.originId);
    }; 
    this.pc.onicecandidate = this.handleIceCandidate;
    this.pc.onaddstream = this.handleRemoteStreamAdded;
    this.pc.onremovestream = this.handleRemoteStreamRemoved;
    this.pc.oniceconnectionstatechange = this.handleIceConnectionChange;
  }

  handleIceCandidate(event) {
    console.log('handleIceCandidate event: ', event);
    if(event.candidate) {
      send(this.broadcasterId, {
        type: "candidate",
        candidate: event.candidate
      }, this.originId);
    }
  }

  handleRemoteStreamAdded(event) {
    console.log('got a stream from broadcaster');
    console.log('originId without slice:', this.originId);
    console.log('broadcasterId without slice:', this.broadcasterId);
    // const compositeKey = this.originId.slice(2) + this.broadcasterId.slice(2);
    const compositeKey = this.originId + this.broadcasterId;
    console.log('compositeKey in handleRemoteStreamAdded:', compositeKey);
    // got remote video stream, now let's show it in a video tag
    const video = $('<video class="newVideo"></video>').attr(
      {
        'src': window.URL.createObjectURL(event.stream),
        'autoplay': true,
        'id': compositeKey
      });
    this.setRemoteStream(event.stream);

    // invoke broadcasterAdded callback
    if(this.viewerHandlers && this.viewerHandlers.broadcasterAdded) {
      this.viewerHandlers.broadcasterAdded(video);
    }
  }

  handleRemoteStreamRemoved(event) {
    // don't think this handler is being invoked
    console.log('broadcaster stream removed');
  }

  handleIceConnectionChange() {
    if(this.pc) {
      console.log('inside handleIceCandidateDisconnect', this.pc.iceConnectionState);
    }
  }

  receiveOffer(offer) {
    this.pc.setRemoteDescription(new RTCSessionDescription(offer));
  }

  createAnswerWrapper() {
    this.pc.createAnswer( (answer) => {

      // set bandwidth constraints for webrtc peer connection
      var sessionDescription = new RTCSessionDescription(answer);
      sessionDescription.sdp = this.setSDPBandwidth(sessionDescription.sdp);
      this.pc.setLocalDescription(sessionDescription);

      send(this.broadcasterId, {
        type: "answer",
        answer: answer
      }, this.originId);
    }, (error) => {
      console.log('Error with creating viewer offer', error);
    });
  }

  addCandidate(candidate) {
    this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
  
  closeWrapper() {
    this.pc.close();

    // const compositeKey = this.originId.slice(2) + this.broadcasterId.slice(2);

    // invoke broadcasterRemoved callback passing in video id to indicate dom element removal
    // if(this.viewerHandlers && this.viewerHandlers.broadcasterRemoved) {
    //   this.viewerHandlers.broadcasterRemoved(compositeKey);
    // }
  }

  setSDPBandwidth(sdp) {
    sdp = sdp.replace( /b=AS([^\r\n]+\r\n)/g , '');
    sdp = sdp.replace( /a=mid:audio\r\n/g , 'a=mid:audio\r\nb=AS:50\r\n');
    sdp = sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:256\r\n');
    return sdp;
  }
}

module.exports = ConspectioViewer;