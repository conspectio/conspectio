const send = require('./send.js');

// custom wrapper class over RTCPeerConnection object
class ConspectioBroadcaster {
  constructor(viewerId, stream) {
    this.viewerId = viewerId;
    this.pc;
    this.stream = stream;
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
    this.pc.viewerId = this.viewerId; // add custom attribute
    this.pc.onicecandidate = this.handleIceCandidate;
    this.pc.addStream(this.stream);
    this.pc.oniceconnectionstatechange = this.handleIceConnectionChange;
  }

  handleIceCandidate(event) {
    console.log('handleIceCandidate event: ', event);
    console.log('handleIceCandidate this', this);
    console.log('handleIceCandidate viewerId', this.viewerId);
    if(event.candidate) {
      send(this.viewerId, {
        type: "candidate",
        candidate: event.candidate
      });
    }  
  }

  handleIceConnectionChange() {
    if(this.pc) {
      console.log('inside handleIceCandidateDisconnect', this.pc.iceConnectionState);

      // comment out the following check to allow for iceRestart
      // if(this.pc.iceConnectionState === 'disconnected') {
      //   console.log('inside pc.onIceConnectionState')
      //   this.pc.close();
      //   delete conspectio.connections[this.viewerId];
      // }
    }
  }

  createOfferWrapper() {
    this.pc.createOffer( (offer) => {
      send(this.viewerId, {
        type: "offer",
        offer: offer
      });
      
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
    console.log('ConspectioBroadcaster removeStreamWrapper invoked')
  }

  closeWrapper() {
    this.pc.close();
    console.log('ConspectioBroadcaster closeWrapper invoked');
  }

  setSDPBandwidth(sdp) {
    sdp = sdp.replace( /b=AS([^\r\n]+\r\n)/g , '');
    sdp = sdp.replace( /a=mid:audio\r\n/g , 'a=mid:audio\r\nb=AS:50\r\n');
    sdp = sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:256\r\n');
    return sdp;
  }
}

module.exports = ConspectioBroadcaster;