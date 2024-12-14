## 前言
本文將詳細介紹如何在樹莓派上使用 C++ 實現共享記憶體的讀寫，並通過 Node.js 從共享記憶體中讀取數據，實現跨語言、跨進程的數據交互。我們將利用 POSIX 共享記憶體（shm_open 和 mmap）來實現進程間通訊，並使用 Node.js 的 ffi-napi 和 ref-napi 模組調用 C 標準庫函數，從共享記憶體中讀取數據。

- `[任務一] 使用 C++ 讀寫數值：在這一部分，我們將撰寫兩個 C++ 程式，一個負責將浮點數寫入共享記憶體，另一個負責從共享記憶體讀取浮點數。

[任務二] 使用 Node.js 讀取數值：接著，我們將撰寫一個 Node.js 程式，通過調用 C 標準庫函數，從共享記憶體中讀取浮點數，實現跨語言的數據交互。

## [Task1] 使用C++讀寫數值
在樹莓派上撰寫兩個 C++ 程式：一個負責將浮點數寫入共享記憶體，另一個負責從共享記憶體讀取浮點數。在 Linux 系統（如樹莓派）上，可以使用 POSIX 共享記憶體（shm_open 和 mmap）來實現進程間通訊。

**寫入程式（shared_memory_writer.cpp）**：

```cpp
#include <iostream>
#include <sys/mman.h>
#include <sys/stat.h> /* For mode constants */
#include <fcntl.h>    /* For O_* constants */
#include <unistd.h>
#include <cstring>

int main() {
    const char *name = "/my_shared_memory"; // 共享記憶體名稱
    const size_t SIZE = sizeof(float);      // 共享記憶體大小

    // 創建共享記憶體對象
    int shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);
    if (shm_fd == -1) {
        std::cerr << "共享記憶體創建失敗" << std::endl;
        return 1;
    }

    // 設置共享記憶體大小
    if (ftruncate(shm_fd, SIZE) == -1) {
        std::cerr << "設定共享記憶體大小失敗" << std::endl;
        return 1;
    }

    // 映射共享記憶體
    void *ptr = mmap(0, SIZE, PROT_WRITE, MAP_SHARED, shm_fd, 0);
    if (ptr == MAP_FAILED) {
        std::cerr << "共享記憶體映射失敗" << std::endl;
        return 1;
    }

    float data = 3.14159f; // 要寫入的浮點數

    // 寫入共享記憶體
    memcpy(ptr, &data, sizeof(float));

    std::cout << "已寫入浮點數：" << data << std::endl;

    // 解除映射
    munmap(ptr, SIZE);

    // 關閉共享記憶體對象
    close(shm_fd);

    return 0;
}
```

**讀取程式（shared_memory_reader.cpp）**：

```cpp
#include <iostream>
#include <sys/mman.h>
#include <sys/stat.h> /* For mode constants */
#include <fcntl.h>    /* For O_* constants */
#include <unistd.h>
#include <cstring>

int main() {
    const char *name = "/my_shared_memory"; // 與寫入程式相同的共享記憶體名稱
    const size_t SIZE = sizeof(float);      // 共享記憶體大小

    // 打開共享記憶體對象
    int shm_fd = shm_open(name, O_RDONLY, 0666);
    if (shm_fd == -1) {
        std::cerr << "共享記憶體打開失敗" << std::endl;
        return 1;
    }

    // 映射共享記憶體
    void *ptr = mmap(0, SIZE, PROT_READ, MAP_SHARED, shm_fd, 0);
    if (ptr == MAP_FAILED) {
        std::cerr << "共享記憶體映射失敗" << std::endl;
        return 1;
    }

    float data;

    // 從共享記憶體讀取
    memcpy(&data, ptr, sizeof(float));

    std::cout << "讀取到的浮點數：" << data << std::endl;

    // 解除映射
    munmap(ptr, SIZE);

    // 關閉共享記憶體對象
    close(shm_fd);

    // 刪除共享記憶體對象
    shm_unlink(name);

    return 0;
}
```


## 編譯與執行步驟
### 1. 編譯程式
在終端中，進入程式所在的目錄，然後執行以下命令：

```bash
g++ -o  shared_memory_writer shared_memory_writer.cpp
g++ -o  shared_memory_reader shared_memory_reader.cpp
```

如果發生編譯失敗（特別是出現與 shm_open 或 POSIX 實時函數相關的錯誤），可以在編譯命令後加上 `-lrt`，如下所示：

```bash
g++ -o  shared_memory_writer shared_memory_writer.cpp -lrt
g++ -o  shared_memory_reader shared_memory_reader.cpp -lrt
```

在 Linux 系統上，有些程式在編譯時需要加上 `-lrt` 標誌才能正確連接 POSIX 實時庫 (Realtime Library)，主要原因是 `-lrt` 這個庫包含了一些特殊的 POSIX 實時功能，像是 shm_open 和 shm_unlink 等函數。-lrt 是用來讓編譯器知道要連接這些 POSIX 實時函數，以確保程式正常執行。

是否需要 -lrt 取決於系統的特性、編譯器版本，以及標準函式庫的配置：
- **Glibc 支援的不同**：一些系統的標準 C 庫 (glibc) 已經內建支援實時函數，並且會在預設情況下提供 POSIX 實時功能，因此編譯器自動連接了這些函數。特別是新的 Linux 發行版，如 Debian、Ubuntu、Raspbian 等，可能已經整合了這些實時功能，無需額外指定 -lrt。

### 2. 執行程式
首先運行寫入程式：

```bash
./shared_memory_writer
```

輸出應該會顯示：

```
3.14159
```

然後運行讀取程式：

```bash
./shared_memory_reader
```

輸出應該會顯示：

```
3.14159
```

> 執行讀取完畢後程式會將name=>my_shared_memory清除，故在執行一次shared_memory_reader會出現`共享記憶體打開失敗`是正常的。
> 若不想每次讀完就清空請將 reafer 程式最後一行的`shm_unlink(name);`註解。
> 另外共享記憶體是寫在RAM上，故重新啟動會自動清空。


### 注意事項：
- **共享記憶體名稱**： 在 shm_open 中使用的名稱必須以斜杠 / 開頭，例如 /my_shared_memory。
- **權限設置**： 在創建共享記憶體時，權限設置為 0666，表示所有用戶都可讀寫。如果需要更嚴格的權限，請根據需要進行調整。
- **刪除共享記憶體**： 在讀取程式中，使用 shm_unlink 刪除共享記憶體對象，這是為了防止資源洩漏。如果您需要多次讀取，請在適當的時機進行刪除。
- **錯誤處理**： 在實際應用中，建議對每個系統調用都進行錯誤檢查，並適當處理錯誤。


## [Task2] 使用 Node.js 讀取數值
接下來要撰寫一個 Node.js 程式，用於從 C++ 程式寫入的共享記憶體中讀取浮點數值。在 Node.js 中，沒有內建的方法直接訪問 POSIX 共享記憶體。但是，我們可以使用 ffi-napi 和 ref-napi 模組來調用 C 標準庫函數，如 shm_open、mmap 等，以實現從共享記憶體中讀取數據。

### 步驟 1：安裝必要的 Node.js 模組
首先，需要在專案目錄中中安裝 ffi-napi 和 ref-napi：

```sh
npm install ffi-napi ref-napi
```

### 步驟 2：撰寫 Node.js 程式
創建一個名為 index.js 的檔案，並添加以下內容：

```js
// ldd --version > (Ubuntu GLIBC 2.35-0ubuntu3.8) 2.35
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


// 定義常量
const O_RDONLY = 0;         // 只讀模式
const PROT_READ = 0x1;      // 頁面可被讀取
const MAP_SHARED = 0x01;    // 與其他所有映射該對象的進程共享

const name = '/my_shared_memory'; // 與 C++ 程式中相同的共享記憶體名稱
const SIZE = ref.types.float.size; // float 的大小（通常為 4 個字節）

// 打開共享記憶體
const shm_fd = libc.shm_open(name, O_RDONLY, 0o666);
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
libc.shm_unlink(name);
```

- **引入模組**： 使用 ffi-napi 來調用 C 標準庫函數，ref-napi 用於處理指針和數據類型。
- **定義函數**： 使用 ffi.Library 加載 C 標準庫中的函數，如 shm_open、mmap、munmap 等。
- **設置常量**： 定義需要的標誌和權限常量。這些常量的值可能根據系統不同而有所變化，請根據您的系統進行調整。
- **打開共享記憶體**： 使用 shm_open 打開共享記憶體對象。
- **映射共享記憶體**： 使用 mmap 將共享記憶體映射到進程的地址空間。
- **讀取數據**： 使用 ref 模組從共享記憶體中讀取浮點數值。
- **清理資源**： 解除映射，關閉文件描述符，並根據需要刪除共享記憶體對象。

### 步驟 3：運行程式

**確保 C++ 寫入程式已經運行**：
首先，運行編譯好的 `shared_memory_writer.cpp`，以創建並寫入共享記憶體。

```
./shared_memory_writer
```

**運行 Node.js 讀取程式**：

```
node index.js
```

應該會看到類似以下的輸出：

```
讀取到的浮點數：3.14159
```

如果執行 Node.js 程式失敗，請回想是否在 C++ 編譯時曾遇到需要加上 `-lrt` 才成功編譯的情況。這可能表示 Node.js 程式也需要額外連接 POSIX 庫，才能調用所需的函數。詳細的程式碼實作範例，請參考 [GitHub]()。