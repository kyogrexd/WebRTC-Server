const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { v4: uuidv4 } = require("uuid");
const { jsonp, json, set } = require("express/lib/response");
const myClass = require("./class");
const { emit } = require("process");
require('dotenv').config();

const system = new Map(); 


/**
 * 連線 port 設定
 */
app.listen(8000, () => {
    console.log(`API listening on *:8000`)
})

server.listen(8500, () => {
    console.log(`listening on *: 8500`)
});


app.get('/api/roomInfo', (req, res) => {
    let data = []
    for (let [roomID, value] of system) {
        data.push({
            roomID: roomID,
            roomUser: value
        })
    }

    return res.send({
        result: {
            roomInfoList: data
        }
    })
})

// let list = []
// list.push(new myClass.User("UserA", "123"))
// system.set("Chatroom 1", list)

// let room = system.get("Chatroom 1")

// room.push(new myClass.User("UserB", "456"))


// if (room != undefined) {
//     if (room.length > 1) {
//         let del = room.filter((it) => it.socketID != "123")
//         system.set("Chatroom 1", del)
//         console.log(system)
//         console.log(room[0])
//     }
// }

/**
 * socket 事件
 */

io.on('connection', (socket) => {
    console.log("------------------------------------------------------------------------------------------");
    console.log('user connected ' + 'socketID: ' + socket.id);
    console.log('time' + new Date()); 

    socket.emit("connected",{ socketID: socket.id });

    socket.on("joinRoom", (obj) => {
        let room = system.get(obj.roomID)
        if (room == undefined) {
            let list = []
            list.push(
                new myClass.User(obj.userName, socket.id)
            )
            system.set(obj.roomID, list)
        } else { 
            if (room.length == 1) { //滿人 開始通話
                room.push(
                    new myClass.User(obj.userName, socket.id)
                )
                socket.emit("startCall", { isCaller: false })
                io.to(room[0].socketID).emit("startCall", { isCaller: true })
                
            } else {
                socket.emit("error", {errMsg: "已滿人"})
            }
        }
        console.log(system)
    })
    
    socket.on("endCall", (obj) => {
        console.log(obj);
        let room = system.get(obj.roomID)
        if (room != undefined) {
            if (room.length > 1) {
                let newList = room.filter((it) => it.socketID != obj.socketID)
                system.set(obj.roomID, newList)

                io.to(system.get(obj.roomID)[0].socketID).emit("targetLeave", {msg: "對方已離開"})
            } else {
                system.delete(obj.roomID)
            }

            console.log(system)
        }
    })
})