import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebrtcService } from '../services/webrtc.service';
import { SignalingService } from '../services/signaling.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html'
})
export class VideoCallComponent implements AfterViewInit, OnDestroy {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  roomId!: string;
  isCaller = false;
  callStarted = false;

  mediaRecorder!: MediaRecorder;
  recordedChunks: Blob[] = [];
  pendingIce: RTCIceCandidateInit[] = [];

  constructor(
    private route: ActivatedRoute,
    private rtc: WebrtcService,
    private signaling: SignalingService
  ) {}

  async ngAfterViewInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId')!;

    await this.rtc.init(this.localVideo.nativeElement);
    this.rtc.createPeer();

    this.rtc.peer.onicecandidate = e => {
      if (e.candidate) {
        this.signaling.send({ type: 'ice', candidate: e.candidate });
      }
    };

    this.rtc.peer.ontrack = e => {
      this.remoteVideo.nativeElement.srcObject = e.streams[0];
    };

    this.signaling.connect(this.roomId);

    this.signaling.onMessage(async msg => {

      if (msg.type === 'offer' && !this.isCaller) {
        await this.rtc.peer.setRemoteDescription(msg.offer);
        const answer = await this.rtc.peer.createAnswer();
        await this.rtc.peer.setLocalDescription(answer);

        this.signaling.send({ type: 'answer', answer });
        this.flushIce();
        this.callStarted = true;
      }

      if (msg.type === 'answer' && this.isCaller) {
        await this.rtc.peer.setRemoteDescription(msg.answer);
        this.flushIce();
        this.callStarted = true;
      }

      if (msg.type === 'ice') {
        if (this.rtc.peer.remoteDescription) {
          await this.rtc.peer.addIceCandidate(msg.candidate);
        } else {
          this.pendingIce.push(msg.candidate);
        }
      }
    });
  }

  async startCall() {
    if (this.callStarted) return;

    this.isCaller = true;
    const offer = await this.rtc.peer.createOffer();
    await this.rtc.peer.setLocalDescription(offer);

    this.signaling.send({ type: 'offer', offer });
  }

  startRecording() {
    const localStream = this.rtc.localStream;
    const remoteStream = this.remoteVideo.nativeElement.srcObject as MediaStream;

    const combinedStream = new MediaStream([
      ...localStream.getTracks(),
      ...remoteStream.getTracks()
    ]);

    this.mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm; codecs=vp8,opus'
    });

    this.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `video-call-${Date.now()}.webm`;
      a.click();

      URL.revokeObjectURL(url);
      this.recordedChunks = [];
    };

    this.mediaRecorder.start();
    console.log('🎥 Recording started');
  }

  stopRecording() {
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('🛑 Recording stopped');
    }
  }

  async flushIce() {
    for (const c of this.pendingIce) {
      await this.rtc.peer.addIceCandidate(c);
    }
    this.pendingIce = [];
  }

  ngOnDestroy() {
    this.rtc.peer?.close();
    this.rtc.localStream?.getTracks().forEach(t => t.stop());
  }
}
