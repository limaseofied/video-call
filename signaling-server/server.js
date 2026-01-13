const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 }, () => {
  console.log('✅ WebSocket server running on ws://localhost:3000');
});

wss.on('connection', ws => {
  console.log('🔌 Client connected');

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    if (data.type === 'join') {
      ws.roomId = data.roomId;
      return;
    }

    wss.clients.forEach(client => {
      if (
        client !== ws &&
        client.readyState === WebSocket.OPEN &&
        client.roomId === ws.roomId
      ) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on('close', () => console.log('❌ Client disconnected'));
});
