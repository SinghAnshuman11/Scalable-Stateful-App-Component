const { WebSocketServer, WebSocket } = require('ws');

const wss = new WebSocketServer({ port: 3001 });

const servers = new Set();

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  console.log('A user-facing server instance has connected to the relayer.');
  servers.add(ws);

  ws.on('message', function message(data) {

    servers.forEach(server => {
      if (server.readyState === WebSocket.OPEN) {
        server.send(data);
      }
    });
  });

  ws.on('close', () => {
    console.log('A user-facing server instance has disconnected.');
    servers.delete(ws);
  });
});