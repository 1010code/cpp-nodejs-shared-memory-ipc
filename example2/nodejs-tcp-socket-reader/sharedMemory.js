// sharedMemory.js

const ffi = require('ffi-napi');
const ref = require('ref-napi');

// 定義 C 標準類型和函數
const voidPtr = ref.refType(ref.types.void);
const off_t = ref.types.long;
const size_t = ref.types.size_t;
const int = ref.types.int;

// 載入 libc 庫
const libc = ffi.Library(null, {
  shm_open: [int, ['string', int, int]],
mmap: [voidPtr, [voidPtr, size_t, int, int, int, off_t]],
munmap: [int, [voidPtr, size_t]],
close: [int, [int]],
shm_unlink: [int, ['string']]
});

/****
 ***libc + librt庫(舊版寫法)****
// 載入 libc 庫
const libc = ffi.Library(null, {
  mmap: [voidPtr, [voidPtr, size_t, int, int, int, off_t]],
  munmap: [int, [voidPtr, size_t]],
  close: [int, [int]],
});

// 載入 librt 庫，用於 shm_open 和 shm_unlink
const librt = ffi.Library('librt', {
  shm_open: [int, ['string', int, int]],
  shm_unlink: [int, ['string']],
});
 */

// 定義常量
const O_RDONLY = 0;         // 只讀模式
const PROT_READ = 0x1;      // 頁面可被讀取
const MAP_SHARED = 0x01;    // 與其他所有映射該對象的進程共享

class SharedMemoryReader {
  constructor(name, dataSize) {
    this.name = name;
    this.dataSize = dataSize;
    this.floatSize = ref.types.float.size;
    this.SIZE = this.dataSize * this.floatSize;

    // 打開共享記憶體
    this.shm_fd = librt.shm_open(this.name, O_RDONLY, 0o666);
    if (this.shm_fd === -1) {
      throw new Error('共享記憶體打開失敗');
    }

    // 映射共享記憶體
    this.ptr = libc.mmap(
      null,
      this.SIZE,
      PROT_READ,
      MAP_SHARED,
      this.shm_fd,
      0
    );

    if (this.ptr.address() === 0 || this.ptr.isNull()) {
      libc.close(this.shm_fd);
      throw new Error('共享記憶體映射失敗');
    }

    // 將指標轉換為 Buffer
    this.buffer = ref.reinterpret(this.ptr, this.SIZE);
  }

  // 讀取多個浮點數
  readData() {
    const dataArray = [];
    for (let i = 0; i < this.dataSize; i++) {
      const data = this.buffer.readFloatLE(i * this.floatSize);
      dataArray.push(data);
    }
    return dataArray;
  }

  // 關閉共享記憶體
  close() {
    libc.munmap(this.ptr, this.SIZE);
    libc.close(this.shm_fd);
    // 刪除共享記憶體對象（如果需要）
    //libc.shm_unlink(name);
  }
}

module.exports = SharedMemoryReader;
