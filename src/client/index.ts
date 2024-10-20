import { io } from "socket.io-client";
import { v4 as uuidv4 } from 'uuid';

const socket = io("http://localhost:3000", { path: "/socket/" });

type UserInfo = {
  name: string,
  uuid: string
}

const uuid = uuidv4();
const  userInfo: UserInfo = {name: "bar", uuid: uuid};
socket.on("connect", () => {
  socket.emit("join", {roomId: "room01"});
  console.log("client connected");

  socket.emit("info", userInfo);
});

socket.on("join", params => {
  console.log("joininfo");
  console.log(params);

});

socket.on("user-join-info", params => {
  let users: Array<UserInfo> = params as Array< UserInfo>;
  console.log(users)
})
