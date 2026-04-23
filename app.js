const express = require('express');
const path = require('path');
const http = require('http'); 
const socketIO = require('socket.io');

const PORT = process.env.PORT || 5050;

///////////
///  APP SETUP
///////////

const app = express();
const server = http.createServer(app); 
// We attach Socket.io to the "server", not the "app"
const io = socketIO(server); 

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

//////////////////
///  SOCKET.IO LOGIC
//////////////////

io.on('connection', (client) => {

    client.on('playerInfo', (message) => {

        // Join the room
        client.join(message.pass);

        client.roomId = message.pass;
        client.gameId = message.id;

        // Broadcast player position to others in the same room
        client.broadcast.to(message.pass).emit('playerInfo', message);
    });

    client.on('disconnect', () => {
        // Broadcast disconnection to the room
        if (client.roomId) {
            client.broadcast.to(client.roomId).emit('playerLeft', client.gameId);
        }
    });

});

///////////
///  START SERVER
///////////

server.listen(PORT, () => {
    console.log('App listening on port ' + PORT);
});
