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

// ユーザの接続
io.on("connection", (socket) => {
  let roomId:string;
  // ルームへの参加
  socket.on("join", (params) => {
    roomId = params.roomId;
    socket.join(roomId);
  });
  // 自身のIDを受信, socket.io側のidとセットにして保存
  socket.on("info", (params) => {
    const userInfo: UserInfo = params as UserInfo;
    addUserInfo(roomId,socket.id, userInfo);
    // ルームに参加しているユーザ情報を通知
    io.to(roomId).emit("user-join-info", getUserInfos(roomId));
  });

  socket.on("disconnect", params => {
    removeUserInfo(socket.id);
    io.to(roomId).emit("user-join-info", getUserInfos(roomId));
  })

  // ユーザのジャンプを受信
  socket.on("jump", params => {
    const jumpUser = getUserInfo(socket.id);
    // ルームへジャンプしたユーザを通知
    io.to(roomId).emit("user-jump", jumpUser);
  });

  // ゲームの準備完了を受信
  socket.on("start", params => {
    // 準備完了のユーザを保存する
    const startReadyUser = getUserInfo(socket.id);
    if(startReadyUser != null){
      const duplicate = readyUsers.filter((f) => f.clientId == startReadyUser.clientId);
      if(duplicate.length === 0){
        readyUsers.push(startReadyUser);
      }
    }
    // ルーム内の全員が準備完了した場合ゲームを開始、球の発射
    if(isGameStart(roomId)){
      startBullet();
    }
  });

  // ヒット情報の受信
  socket.on('hit', params => {
    const hitUser = getUserInfo(socket.id);
    // ヒットしたユーザを保存
    if(hitUser != null){
      io.to(roomId).emit('user-hit', {clientId: hitUser.clientId})
      const duplicate = gameOverUsers.filter((f) => f.clientId == hitUser.clientId);
      if(duplicate.length === 0){
        gameOverUsers.push(hitUser);
      }
    }
    // ルーム内のユーザが全員ヒットしたらゲーム終了をルームに送信
    if(isGameSet(roomId)){
      stopBullet();
      io.to(roomId).emit("gameSet", {});
      gameOverUsers = [];
      readyUsers = [];
    }
  })
  // 5秒ごとに球の発射を通知
  function startBullet() {
    if (intervalId === null) {
        intervalId = setInterval(() => {
        io.to(roomId).emit("bullet",{});
        }, 5000);
    }
  }

  // ゲーム終了時に球の発射を停止
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
  return isUsersEqual(userInfos, gameOverUsers);
}

function isGameStart(roomId: string):boolean{
  const userInfo = getUserInfos(roomId);
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
