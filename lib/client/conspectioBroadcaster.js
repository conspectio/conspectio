const send = require('./send.js');
const {coldBrewRTC} = require('cold-brew/rtc');

// custom wrapper class over RTCPeerConnection object
class ConspectioBroadcaster {
  constructor(viewerId, stream, originId) {
    this.viewerId = viewerId;
    this.pc;
    this.stream = stream;
    this.originId = originId;
  }

  init() {
    this.pc = coldBrewRTC({
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
    }, null, {label: this.originId + this.broadcasterId});
    this.pc.viewerId = this.viewerId; // add custom attribute
    this.pc.originId = this.originId; // add custom attribute
    this.pc.onicecandidate = this.handleIceCandidate;
    this.pc.addStream(this.stream);
    this.pc.oniceconnectionstatechange = this.handleIceConnectionChange;
  }

  handleIceCandidate(event) {
    /////check version
    console.log('handleIceCandidate event: ', event);
    console.log('handleIceCandidate this', this);
    console.log('handleIceCandidate viewerId', this.viewerId);
    if(event.candidate) {
      send(this.viewerId, {
        type: "candidate",
        candidate: event.candidate
      }, this.originId);
    }  
  }

  handleIceConnectionChange() {
    if(this.pc) {
      console.log('inside handleIceCandidateDisconnect', this.pc.iceConnectionState);
    }
  }

  createOfferWrapper(toId) {
    this.pc.createOffer( (offer) => {
      var toId = toId || this.viewerId;
      send(toId, {
        type: "offer",
        offer: offer
      }, this.originId);
      
      // set bandwidth constraints for webrtc peer connection
      var sessionDescription = new RTCSessionDescription(offer);
      sessionDescription.sdp = this.setSDPBandwidth(sessionDescription.sdp);
      this.pc.setLocalDescription(sessionDescription);
    }, (error) => {
      console.log('Error with creating broadcaster offer', error);
    },{
      iceRestart: true
    });
  }

  receiveAnswer(answer) {
    this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  addCandidate(candidate) {
    this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  removeStreamWrapper() {
    this.pc.removeStream(this.stream);
  }

  replaceStreamWrapper(sourceStream) {
    this.pc.removeStream(this.stream);
    this.pc.addStream(sourceStream); 
  }

  closeWrapper() {
    this.pc.close();
  }

  setSDPBandwidth(sdp) {
    sdp = sdp.replace( /b=AS([^\r\n]+\r\n)/g , '');
    sdp = sdp.replace( /a=mid:audio\r\n/g , 'a=mid:audio\r\nb=AS:50\r\n');
    sdp = sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:256\r\n');
    return sdp;
  }
}

module.exports = ConspectioBroadcaster;