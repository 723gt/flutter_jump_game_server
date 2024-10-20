const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Expressサーバを作成
const app = express();
const server = http.createServer(app);
const io = new Server(server, { path: '/socket/' });

// 静的ファイルを提供 (index.htmlを提供するため)
app.use(express.static(__dirname + '/public'));

// クライアントが接続したときの処理
io.on('connection', (socket) => {
  console.log('A client connected.');

  // クライアントからの"info"イベントを処理
  socket.on('info', (userInfo) => {
    console.log('Received user info:', userInfo);

    // 他のクライアントにjoinイベントで情報を送信
    io.emit('user-join-info', [{ name: userInfo.name, uuid: uuidv4() }]);
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected.');
  });
});

// サーバーを起動
server.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
