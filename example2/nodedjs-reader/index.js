// 引入共享記憶體讀取模組
const SharedMemoryReader = require('./sharedMemory');

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

// 定義一個函數，每 100 毫秒讀取一次共享記憶體
function readAndEmitData() {
  try {
    const dataArray = sharedMemoryReader.readData();
    console.log('讀取到的浮點數數組：', dataArray);
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
