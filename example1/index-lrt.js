// ldd --version > Ubuntu GLIBC 2.31
const ffi = require('ffi-napi');
const ref = require('ref-napi');

// 定義 C 標準類型和函數
const voidPtr = ref.refType(ref.types.void);
const off_t = ref.types.long;
const size_t = ref.types.size_t;
const int = ref.types.int;

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

// 定義常量
const O_RDONLY = 0;         // 只讀模式
const PROT_READ = 0x1;      // 頁面可被讀取
const MAP_SHARED = 0x01;    // 與其他所有映射該對象的進程共享

const name = '/my_shared_memory'; // 與 C++ 程式中相同的共享記憶體名稱
const SIZE = ref.types.float.size; // float 的大小（通常為 4 個字節）

// 打開共享記憶體
const shm_fd = librt.shm_open(name, O_RDONLY, 0o666);
if (shm_fd === -1) {
  console.error('共享記憶體打開失敗');
  process.exit(1);
}

// 映射共享記憶體
const ptr = libc.mmap(
  null,
  SIZE,
  PROT_READ,
  MAP_SHARED,
  shm_fd,
  0
);

if (ptr.address() === 0 || ptr.isNull()) {
  console.error('共享記憶體映射失敗');
  libc.close(shm_fd);
  process.exit(1);
}

// 將指標轉換為 Buffer
const buffer = ref.reinterpret(ptr, SIZE);

// 讀取浮點數（小端模式）
const data = buffer.readFloatLE(0);

console.log('讀取到的浮點數：', data);

// 解除映射
libc.munmap(ptr, SIZE);

// 關閉共享記憶體文件描述符
libc.close(shm_fd);

// 刪除共享記憶體對象（如果需要）
//librt.shm_unlink(name);