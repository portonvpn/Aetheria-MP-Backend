const express = require('express');
const http = require('http'); 
const socketIO = require('socket.io');

const PORT = process.env.PORT || 5050;
const app = express();
const server = http.createServer(app); 

const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Extra safety for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
    res.send("Server is running!");
});

io.on('connection', (client) => {
    client.on('playerInfo', (message) => {
        client.join(message.pass);
        client.roomId = message.pass;
        client.gameId = message.id;
        client.broadcast.to(message.pass).emit('playerInfo', message);
    });

    client.on('disconnect', () => {
        if (client.roomId) {
            client.broadcast.to(client.roomId).emit('playerLeft', client.gameId);
        }
    });
});

server.listen(PORT, () => {
    console.log('App listening on port ' + PORT);
});
