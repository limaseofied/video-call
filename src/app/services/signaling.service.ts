import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private ws!: WebSocket;
  private handler!: (msg: any) => void;
  private queue: any[] = [];

  connect(roomId: string) {
    this.ws = new WebSocket('ws://localhost:3000');

    this.ws.onopen = () => {
      this.send({ type: 'join', roomId });
      this.queue.forEach(m => this.ws.send(JSON.stringify(m)));
      this.queue = [];
    };

    this.ws.onmessage = e => {
      this.handler?.(JSON.parse(e.data));
    };
  }

  send(msg: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.queue.push(msg);
    }
  }

  onMessage(fn: (msg: any) => void) {
    this.handler = fn;
  }
}
