// server.js

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

// 配置 CORS
const io = new Server(server, {
  cors: {
    origin: '*', // 為了方便，暫時允許所有來源
    methods: ['GET', 'POST']
  }
});

// 引入共享記憶體讀取模組
const SharedMemoryReader = require('./sharedMemory');

// 提供靜態文件，如 index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Socket.IO 連接處理
io.on('connection', (socket) => {
  console.log('a user connected');

  // 處理客戶端斷開連接
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// 啟動伺服器
server.listen(3000, '0.0.0.0', () => {
  console.log('listening on *:3000');
});

// 創建共享記憶體讀取器實例
const name = '/my_shared_memory'; // 與 C++ 程式中相同的共享記憶體名稱
const dataSize = 2;               // 要讀取的浮點數數量，請根據實際情況修改

let sharedMemoryReader;
try {
  sharedMemoryReader = new SharedMemoryReader(name, dataSize);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// 定義一個函數，每 100 毫秒讀取一次共享記憶體，並通過 Socket.IO 發送給客戶端
function readAndEmitData() {
  try {
    const dataArray = sharedMemoryReader.readData();
    // console.log('讀取到的浮點數數組：', dataArray);

    // 通過 Socket.IO 發送數據給所有連接的客戶端
    io.emit('sharedData', dataArray);
  } catch (error) {
    console.error('讀取共享記憶體失敗：', error.message);
  }
}

// 定時讀取共享記憶體
const intervalId = setInterval(readAndEmitData, 100);

// 當程式終止時，釋放資源
process.on('SIGINT', () => {
  clearInterval(intervalId);
  sharedMemoryReader.close();
  console.log('\n程式已退出，資源已釋放。');
  process.exit(0);
});
