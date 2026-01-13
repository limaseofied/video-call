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
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements AfterViewInit, OnDestroy {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  roomId!: string;

  isCaller = false;
  callStarted = false;
  canRecord = false;
  isRecording = false;

  // Timers
  callTime = '00:00';
  recordTime = '00:00';
  private callSeconds = 0;
  private recordSeconds = 0;
  private callTimer!: any;
  private recordTimer!: any;

  // Recording
  mediaRecorder!: MediaRecorder;
  recordedChunks: Blob[] = [];
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
 private drawInterval: any;


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
      this.canRecord = true;
    };

    this.signaling.connect(this.roomId);

    this.signaling.onMessage(async msg => {

      if (msg.type === 'offer' && !this.isCaller) {
        await this.rtc.peer.setRemoteDescription(msg.offer);
        const answer = await this.rtc.peer.createAnswer();
        await this.rtc.peer.setLocalDescription(answer);

        this.signaling.send({ type: 'answer', answer });
        this.flushIce();
        this.startCallTimer();
        this.callStarted = true;
      }

      if (msg.type === 'answer' && this.isCaller) {
        await this.rtc.peer.setRemoteDescription(msg.answer);
        this.flushIce();
        this.startCallTimer();
        this.callStarted = true;
      }

      if (msg.type === 'ice') {
        if (this.rtc.peer.remoteDescription) {
          await this.rtc.peer.addIceCandidate(msg.candidate);
        } else {
          this.pendingIce.push(msg.candidate);
        }
      }

      if (msg.type === 'end-call') {
        this.endCall(false);
      }
    });
  }

  async startCall() {
    this.isCaller = true;

    const offer = await this.rtc.peer.createOffer();
    await this.rtc.peer.setLocalDescription(offer);
    this.signaling.send({ type: 'offer', offer });

    this.startCallTimer();
    this.callStarted = true;
  }

  endCall(sendSignal = true) {
    if (this.isRecording) this.stopRecording();

    if (sendSignal) {
      this.signaling.send({ type: 'end-call' });
    }

    this.stopCallTimer();
    this.stopRecordTimer();

    this.rtc.close();
    this.signaling.close();

    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;

    this.callStarted = false;
    this.canRecord = false;
    this.isCaller = false;
    this.callSeconds = 0;
    this.recordSeconds = 0;
    this.callTime = '00:00';
    this.recordTime = '00:00';

    console.log('📴 Call ended');
  }

  // ⏱ Timers
  startCallTimer() {
    if (this.callTimer) return;
    this.callTimer = setInterval(() => {
      this.callSeconds++;
      this.callTime = this.formatTime(this.callSeconds);
    }, 1000);
  }

  stopCallTimer() {
    clearInterval(this.callTimer);
    this.callTimer = null;
  }

  startRecordTimer() {
    this.recordTimer = setInterval(() => {
      this.recordSeconds++;
      this.recordTime = this.formatTime(this.recordSeconds);
    }, 1000);
  }

  stopRecordTimer() {
    clearInterval(this.recordTimer);
    this.recordTimer = null;
  }

  // 🎥 Recording
  startRecording() {
    this.isRecording = true;
    this.recordSeconds = 0;
    this.startRecordTimer();

    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext('2d')!;

    this.drawInterval = window.setInterval(() => {
      this.ctx.drawImage(this.localVideo.nativeElement, 0, 0, 400, 400);
      this.ctx.drawImage(this.remoteVideo.nativeElement, 400, 0, 400, 400);
    }, 33) as unknown as number;


    const stream = this.canvas.captureStream(30);
    const audio = this.rtc.localStream.getAudioTracks()[0];
    if (audio) stream.addTrack(audio);

    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = e => this.recordedChunks.push(e.data);
    this.mediaRecorder.onstop = () => {
      clearInterval(this.drawInterval);
      this.stopRecordTimer();

      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-${Date.now()}.webm`;
      a.click();

      this.recordedChunks = [];
      this.isRecording = false;
    };

    this.mediaRecorder.start();
  }

  stopRecording() {
    this.mediaRecorder?.stop();
  }

  async flushIce() {
    for (const c of this.pendingIce) {
      await this.rtc.peer.addIceCandidate(c);
    }
    this.pendingIce = [];
  }

  formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy() {
    this.endCall(false);
  }
}
