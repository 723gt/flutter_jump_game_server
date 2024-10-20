"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, { path: "/socket/" });
app.get("/", (req, res) => {
    res.json({
        message: "root path"
    });
});
io.on("connection", (socket) => {
    console.log("connected");
});
httpServer.listen(3000, () => {
    console.log("Chat server listening on port 3000");
});
//# sourceMappingURL=index.js.map