import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebrtcService {
  peer!: RTCPeerConnection;
  localStream!: MediaStream;

  async init(video: HTMLVideoElement) {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    video.srcObject = this.localStream;
    video.muted = true;
    await video.play();
  }

  createPeer() {
    this.peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.localStream.getTracks().forEach(track =>
      this.peer.addTrack(track, this.localStream)
    );
  }
}
