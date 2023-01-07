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

/**
 * 每30秒檢查使用者是否還在線配對中
 */
const schedule = require("node-schedule");
schedule.scheduleJob("*/30 * * * * *", function () {
  console.log("schedule done!!!");

  let now = Date.now();
  let temp = new Map()
  for (let [roomID, value] of system) {
    value = value.filter((it) => Math.abs(now - it.refreshTime) < 30000 )//30秒

    if (value.length == 0) system.delete(roomID)
    else system.set(roomID, value)
  }


  console.log(system)

});

/**
 * socket 事件
 */

io.on('connection', (socket) => {
    console.log("------------------------------------------------------------------------------------------");
    console.log('user connected ' + 'socketID: ' + socket.id);
    console.log('time' + new Date()); 

    socket.emit("connected",{ socketID: socket.id });

    /**
   * 前端每5秒發送一次，更新時間
   */
    socket.on("schedule_pairing_check", (obj) => {
        let refreshTime = Date.now()
        let room = system.get(obj.roomID)
        if (room == undefined) return

        let info = room.find((it) => it.socketID == obj.socketID)
        if (info) info.refreshTime = refreshTime;

    });

    socket.on("joinRoom", (obj) => {
        console.log("[joinRoom]")
        console.log(obj)
        let room = system.get(obj.roomID)
        if (room == undefined) { //Caller 創建房間
            let list = []
            list.push(
                new myClass.User(obj.userName, socket.id, 0)
            )
            let roomID = uuidv4()
            system.set(roomID, list)

            socket.emit("checkRoomID", {roomID: roomID})
        } else { 
            if (room.length == 1) { //Callee 進入房間 開始通話
                room.push(
                    new myClass.User(obj.userName, socket.id, 0)
                )

                socket.emit("checkRoomID", {roomID: obj.roomID})
                socket.emit("startCall", { 
                    isCaller: false, 
                    targetSocketID:  room[0].socketID, 
                    targetUserName: room[0].userName
                })
                io.to(room[0].socketID).emit("startCall", { 
                    isCaller: true, 
                    targetSocketID: socket.id,
                    targetUserName: obj.userName
                })
                
            } else {
                socket.emit("error", {errMsg: "Full"})
            }
        }
        console.log(system)
    })

    socket.on("offer", (obj) => {
        console.log("[offer]")
        console.log(obj)
        
        let room = system.get(obj.roomID)
        if (room != undefined) {
            if (room.find((it) => it.socketID == obj.targetSocketID)) {
                io.to(obj.targetSocketID).emit("offer", {
                    sdp: obj.sdp,
                    type: obj.type
                })
            }
        }
    })

    socket.on("answer", (obj) => {
        console.log("[answer]")
        console.log(obj)
        let room = system.get(obj.roomID)
        if (room != undefined) {
            if (room.find((it) => it.socketID == obj.targetSocketID)) {
                io.to(obj.targetSocketID).emit("answer", {
                    sdp: obj.sdp,
                    type: obj.type
                })
            }
        }
    })

    socket.on("ice_candidates", (obj) => {
        console.log("[ice_candidates]")
        console.log(obj)
        let room = system.get(obj.roomID)
        if (room != undefined) {
            if (room.find((it) => it.socketID == obj.targetSocketID)) {
                io.to(obj.targetSocketID).emit("ice_candidates", {
                    sdpMid: obj.sdpMid,
                    sdpMLineIndex: obj.sdpMLineIndex,
                    candidateSdp: obj.candidateSdp
                })
            }
        }
    })
    
    socket.on("endCall", (obj) => {
        console.log("[endCall]")
        console.log(obj)
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