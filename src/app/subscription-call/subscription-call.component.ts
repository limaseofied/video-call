import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-subscription-call',
  templateUrl: './subscription-call.component.html',
  styleUrls: ['./subscription-call.component.css']
})
export class SubscriptionCallComponent implements OnDestroy {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  callStarted = false;
  callTime = '00:00';
  callSeconds = 0;
  callTimer!: ReturnType<typeof setInterval>;
  totalCallTime = ''; 

  maxCallDuration = environment.subscriptionCallDuration;
  alertBefore = environment.subscriptionCallAlertBefore;
  alertShown = false;

  // Media streams
  localStream!: MediaStream;
  remoteStream!: MediaStream;

  // Recording
  mediaRecorder!: MediaRecorder;
  recordedChunks: Blob[] = [];
  isRecording = false;

  // Canvas for side-by-side recording
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private drawInterval!: ReturnType<typeof setInterval>;

  // --- Call logic ---
  async startCall() {
    if (this.callStarted) return;

    this.callStarted = true;
    this.alertShown = false;
    this.callSeconds = 0;
    this.callTime = '00:00';
    this.totalCallTime = '';

    // Get local video/audio
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localVideo.nativeElement.srcObject = this.localStream;

    // Demo: clone local stream as remote
    this.remoteStream = new MediaStream(this.localStream.getTracks());
    this.remoteVideo.nativeElement.srcObject = this.remoteStream;

    // Start call timer
    this.startCallTimer();
  }

  startCallTimer() {
    this.callTimer = setInterval(() => {
      this.callSeconds++;
      this.callTime = this.formatTime(this.callSeconds);

      // 1-minute warning
      if (!this.alertShown && this.callSeconds === this.maxCallDuration - this.alertBefore) {
        this.alertShown = true;
        alert('⚠️ Only 1 minute remaining in the call!');
      }

      // Auto end call
      if (this.callSeconds >= this.maxCallDuration) {
        alert('📴 Call time is over. Ending call now.');
        this.endCall();
      }
    }, 1000);
  }

  // --- Recording logic ---
  startRecording() {
    if (this.isRecording) return;

    // Create canvas for side-by-side recording
    this.canvas = document.createElement('canvas');
    const localWidth = 640;
    const localHeight = 480;
    this.canvas.width = localWidth * 2;  // side-by-side
    this.canvas.height = localHeight;
    this.ctx = this.canvas.getContext('2d')!;

    const canvasStream = this.canvas.captureStream(60); // 30 FPS

    this.mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm; codecs=vp8,opus',
      videoBitsPerSecond: 5_000_000, // 5 Mbps for higher quality
    });

    this.mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `subscription-call-${Date.now()}.webm`;
      a.click();

      URL.revokeObjectURL(url);
      this.recordedChunks = [];
    };

    this.mediaRecorder.start();
    this.isRecording = true;

    this.drawInterval = setInterval(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.localVideo.nativeElement, 0, 0, localWidth, localHeight);
      this.ctx.drawImage(this.remoteVideo.nativeElement, localWidth, 0, localWidth, localHeight);
    }, 1000 / 60); // 60 FPS


    console.log('🎥 Side-by-side recording started');
  }

  stopRecording() {
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.drawInterval);
      console.log('🛑 Recording stopped');
    }
  }

  // --- End call ---
  endCall() {
    clearInterval(this.callTimer);

    if (this.isRecording) this.stopRecording();

    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());

    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;

    this.totalCallTime = this.formatTime(this.callSeconds);

    this.callStarted = false;
    this.callSeconds = 0;
    this.callTime = '00:00';
    this.alertShown = false;

    console.log('📴 Call ended. Total time: ', this.totalCallTime);
  }

  formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy() {
    this.endCall();
  }
}
