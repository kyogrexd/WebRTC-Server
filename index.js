const fs = require('fs')
const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const { jsonp, json } = require('express/lib/response');

const app = express();
app.listen(4000, () => {
    console.log('API listening on *:' + 4000)
})

const server = http.createServer(app);
server.listen(4040);
const { Server } = require("socket.io");
const io = new Server(server);
console.log("Server socket 4040 , api 4000")

require('dotenv').config();


app.get('/api/messages', (req, res) => {
    let messages = 'hellow world'
    res.send(messages);
})


/**
 * socket 事件
 */

io.on('connection', (socket) => {
    console.log("------------------------------------------------------------------------------------------");
    console.log('user connected ' + 'socketID: ' + socket.id);
    console.log('time' + new Date()); 

    socket.emit("connected",{});


})