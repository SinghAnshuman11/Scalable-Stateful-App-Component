const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

const rooms = {};

const RELAYER_URL = "ws://localhost:3001";
const relayerSocket = new WebSocket(RELAYER_URL);

relayerSocket.on('open', () => {
    console.log(`[ws-user on port ${PORT}] Connected to relayer socket`);
});

relayerSocket.on('error', (err) => {
    console.error('Relayer socket error:', err);
});

relayerSocket.on('message', (data) => {
    const messageAsString = data.toString();
    const parsedData = JSON.parse(messageAsString);
   
    if (parsedData.type === "chat") {
        const room = parsedData.room;
        if (rooms[room]) {
            rooms[room].sockets.forEach(socket => socket.send(messageAsString));
        }
    }
});


wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    try {
        const messageAsString = data.toString();
        const parsedData = JSON.parse(messageAsString);

        if (parsedData.type === "join-room") {
            const room = parsedData.room;
            if (!rooms[room]) {
                rooms[room] = {
                    sockets: []
                }
            }
            rooms[room].sockets.push(ws);
            ws.room = room;
        } else if (parsedData.type === "chat") {
            relayerSocket.send(messageAsString);
        }
    } catch (e) {
        console.error('Failed to parse message or invalid message format:', e);
    }
  });

  ws.on('close', () => {
    const roomName = ws.room;
    if (roomName && rooms[roomName]) {
        
        rooms[roomName].sockets = rooms[roomName].sockets.filter(socket => socket !== ws);

        if (rooms[roomName].sockets.length === 0) {
            delete rooms[roomName];
        }
    }
  });
});