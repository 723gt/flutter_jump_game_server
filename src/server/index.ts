import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

type UserInfo = {
  name: string,
  uuid: string,
}

type ServerUserInfo = { 
  roomId: string,
  id: string,
 info: UserInfo
};

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { path: "/socket/" });
let users: Array<ServerUserInfo> = [];

app.get("/", (req: express.Request, res: express.Response) => {
  res.json({
    message: "root path"
  });
});

io.on("connection", (socket) => {
  let roomId:string;
  // io.emit("join","hello");
  console.log("connected");
  console.log(socket.id)
  socket.on("join", (params) => {
    console.log("join!")
    console.log(params.roomId)
    roomId = params.roomId;
    socket.join(roomId);
  });
  socket.on("info", (params) => {
    console.log("join-info");
    const userInfo: UserInfo = params as UserInfo;
    addUserInfo(roomId,socket.id, userInfo);
    console.log("room!")
    console.log(roomId)
    io.to(roomId).emit("user-join-info", userInfos(roomId));
  });

  socket.on("disconnect", params => {
    console.log("======")
    // console.log(socket.id)
    removeUserInfo(socket.id);
    io.to(roomId).emit("user-join-info", userInfos(roomId));
  })

  socket.on("jump", _ => {
    console.log("jump!!");
  });
});



httpServer.listen(3000, () => {
  console.log("Chat server listening on port 3000");
});

function addUserInfo(roomId: string, id: string, userInfo: UserInfo): Array<ServerUserInfo>{
  const serverInfo: ServerUserInfo = {roomId: roomId, id: id, info: userInfo};
  users.push(serverInfo);
  return users;
}

function removeUserInfo(id: string): void{
  users = users.filter(item => item.id != id);
}

function userInfos(roomId :string): Array<UserInfo> {
  const roomUsers = users.filter(item => item.roomId == roomId);
  return roomUsers.map(item => item.info);
}