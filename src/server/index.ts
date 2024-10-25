import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

type UserInfo = {
  clientId: string,
}

type ServerUserInfo = { 
  roomId: string,
  id: string,
 info: UserInfo
};

let intervalId: NodeJS.Timeout | null = null;


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { path: "/socket/" });
let users: Array<ServerUserInfo> = [];
let gameOverUsers:  Array<UserInfo> = [];
let readyUsers: Array<UserInfo> = [];

app.get("/", (req: express.Request, res: express.Response) => {
  res.json({
    message: "root path"
  });
});

io.on("connection", (socket) => {
  let roomId:string;
  socket.on("join", (params) => {
    roomId = params.roomId;
    socket.join(roomId);
  });
  socket.on("info", (params) => {
    console.log("join-info");
    const userInfo: UserInfo = params as UserInfo;
    addUserInfo(roomId,socket.id, userInfo);
    io.to(roomId).emit("user-join-info", getUserInfos(roomId));
  });

  socket.on("disconnect", params => {
    removeUserInfo(socket.id);
    io.to(roomId).emit("user-join-info", getUserInfos(roomId));
  })

  socket.on("jump", params => {
    const jumpUser = getUserInfo(socket.id);
    io.to(roomId).emit("user-jump", jumpUser);
  });

  socket.on("start", params => {
    const startReadyUser = getUserInfo(socket.id);
    console.log("start");
    if(startReadyUser != null){
      const duplicate = readyUsers.filter((f) => f.clientId == startReadyUser.clientId);
      if(duplicate.length === 0){
        readyUsers.push(startReadyUser);
      }
    }

    if(isGameStart(roomId)){
      startBullet();
    }
  });

  socket.on('hit', params => {
    const hitUser = getUserInfo(socket.id);
    if(hitUser != null){
      io.to(roomId).emit('user-hit', {clientId: hitUser.clientId})
      const duplicate = gameOverUsers.filter((f) => f.clientId == hitUser.clientId);
      if(duplicate.length === 0){
        gameOverUsers.push(hitUser);
      }
    }
    if(isGameSet(roomId)){
      console.log("stop!!!");
      stopBullet();
      io.to(roomId).emit("gameSet", {});
      gameOverUsers = [];
      readyUsers = [];
    }
  })
  function startBullet() {
    if (intervalId === null) {
        intervalId = setInterval(() => {
        io.to(roomId).emit("bullet",{});
        console.log('hello world');
        }, 5000);
    }
  }

  function stopBullet() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
  }
});



httpServer.listen(3000, () => {
  console.log("Chat server listening on port 3000");
});

function addUserInfo(roomId: string, id: string, userInfo: UserInfo): Array<ServerUserInfo>{
  const serverInfo: ServerUserInfo = {roomId: roomId, id: id, info: userInfo};
  users.push(serverInfo);
  return users;
}


function isGameSet(roomId: string): boolean{
  const userInfos = getUserInfos(roomId);
  console.log("isGameSet")
  console.log(gameOverUsers);
  console.log(isUsersEqual(userInfos, gameOverUsers))
  return isUsersEqual(userInfos, gameOverUsers);
}

function isGameStart(roomId: string):boolean{
  const userInfo = getUserInfos(roomId);
  console.log("isGameStart")
  console.log(isUsersEqual(userInfo, readyUsers));
  return(isUsersEqual(userInfo, readyUsers));
}

function removeUserInfo(id: string): void{
  users = users.filter(item => item.id != id);
}

function getUserInfos(roomId :string): Array<UserInfo> {
  const roomUsers = users.filter(item => item.roomId == roomId);
  return roomUsers.map(item => item.info);
}

function getUserInfo(id: string): UserInfo | null{
  const selectedUser = users.find(item => item.id == id );
  if(selectedUser === undefined){
    return null;
  }
  return selectedUser.info;
}


function isUsersEqual(userInfo: Array<UserInfo>, userArray: Array<UserInfo>){
  if(userInfo.length !== userArray.length) return false;
  const userInfoIds = userInfo.map((m) => m.clientId).sort();
  const userArrayIds = userArray.map((m) => m.clientId).sort();
  return userInfoIds.every((val, index) => val == userArrayIds[index]);
}
