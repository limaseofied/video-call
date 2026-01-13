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

  // Call Timer
  callStarted = false;
  callTime = '00:00';
  callSeconds = 0;
  callTimer!: ReturnType<typeof setInterval>;
  totalCallTime = ''; 
  alertShown = false;

  maxCallDuration = environment.subscriptionCallDuration;
  alertBefore = environment.subscriptionCallAlertBefore;

  // Media Streams
  localStream!: MediaStream;
  remoteStream!: MediaStream;

  // Recording
  mediaRecorder!: MediaRecorder;
  recordedChunks: Blob[] = [];
  isRecording = false;

  // Canvas for side-by-side + subtitles
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private drawInterval!: ReturnType<typeof setInterval>;

  // Subtitles
  currentSubtitle = '';
  recognition!: any;

  // --- Start call ---
  async startCall() {
    if (this.callStarted) return;

    this.callStarted = true;
    this.alertShown = false;
    this.callSeconds = 0;
    this.callTime = '00:00';
    this.totalCallTime = '';
    this.currentSubtitle = '';

    // Get local video/audio
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localVideo.nativeElement.srcObject = this.localStream;

    // Demo: clone local stream as remote (replace with real WebRTC in production)
    this.remoteStream = new MediaStream(this.localStream.getTracks());
    this.remoteVideo.nativeElement.srcObject = this.remoteStream;

    // Start speech recognition for subtitles
    this.startSpeechRecognition();

    // Start call timer
    this.startCallTimer();
  }

  // --- Call Timer ---
  startCallTimer() {
    this.callTimer = setInterval(() => {
      this.callSeconds++;
      this.callTime = this.formatTime(this.callSeconds);

      if (!this.alertShown && this.callSeconds === this.maxCallDuration - this.alertBefore) {
          this.alertShown = true;

          const remainingSec = this.maxCallDuration - this.callSeconds;
          const min = Math.floor(remainingSec / 60);
          const sec = remainingSec % 60;
          
          const timeStr = min > 0 
            ? `${min} minute${min > 1 ? 's' : ''}${sec > 0 ? ' ' + sec + ' sec' : ''}` 
            : `${sec} second${sec > 1 ? 's' : ''}`;

          alert(`⚠️ Only ${timeStr} remaining in the call!`);
      }


      if (this.callSeconds >= this.maxCallDuration) {
        alert('📴 Call time is over. Ending call now.');
        this.endCall();
      }
    }, 1000);
  }

  // --- Recording with side-by-side + subtitles + audio ---
  startRecording() {
    if (this.isRecording) return;

    const localWidth = 640;
    const localHeight = 480;
    this.canvas = document.createElement('canvas');
    this.canvas.width = localWidth * 2; // side-by-side
    this.canvas.height = localHeight;
    this.ctx = this.canvas.getContext('2d')!;

    const canvasStream = this.canvas.captureStream(60); // video only

    // Merge audio: local + remote
    const mixedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...this.localStream.getAudioTracks(),
      ...this.remoteStream.getAudioTracks() // optional if remote has audio
    ]);

    this.mediaRecorder = new MediaRecorder(mixedStream, {
      mimeType: 'video/webm; codecs=vp8,opus',
      videoBitsPerSecond: 8_000_000 // high quality
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

    // Draw videos + subtitles on canvas
    this.drawInterval = setInterval(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.localVideo.nativeElement, 0, 0, localWidth, localHeight);
      this.ctx.drawImage(this.remoteVideo.nativeElement, localWidth, 0, localWidth, localHeight);

      // Draw subtitle
      if (this.currentSubtitle) {
        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 3;
        const x = 20;
        const y = this.canvas.height - 20;
        this.ctx.strokeText(this.currentSubtitle, x, y);
        this.ctx.fillText(this.currentSubtitle, x, y);
      }
    }, 1000 / 60); // 60 FPS
  }

  stopRecording() {
    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.drawInterval);
      console.log('🛑 Recording stopped');
    }
  }

  // --- Speech recognition ---
  startSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return console.warn('SpeechRecognition not supported in this browser.');

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = true;

    this.recognition.onresult = (event: any) => {
      let lastTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        lastTranscript = event.results[i][0].transcript;
      }
      this.currentSubtitle = lastTranscript;
    };

    this.recognition.start();
  }

  stopSpeechRecognition() {
    if (this.recognition) this.recognition.stop();
  }

  // --- End call ---
  endCall() {
    clearInterval(this.callTimer);

    if (this.isRecording) this.stopRecording();
    this.stopSpeechRecognition();

    this.localStream?.getTracks().forEach(track => track.stop());
    this.remoteStream?.getTracks().forEach(track => track.stop());

    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;

    this.totalCallTime = this.formatTime(this.callSeconds);

    this.callStarted = false;
    this.callSeconds = 0;
    this.callTime = '00:00';
    this.alertShown = false;
    this.currentSubtitle = '';

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
