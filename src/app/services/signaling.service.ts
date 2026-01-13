import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private socket!: WebSocket;

  connect(roomId: string) {
    this.socket = new WebSocket('ws://localhost:3000');

    this.socket.onopen = () => {
      this.send({ type: 'join', roomId });
    };
  }

  send(data: any) {
    this.socket?.send(JSON.stringify(data));
  }

  onMessage(cb: (msg: any) => void) {
    this.socket.onmessage = e => cb(JSON.parse(e.data));
  }

  close() {
    this.socket?.close();
  }
}
