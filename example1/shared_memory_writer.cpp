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

    float data = 1.55f; // 要寫入的浮點數

    // 寫入共享記憶體
    memcpy(ptr, &data, sizeof(float));

    std::cout << "已寫入浮點數：" << data << std::endl;

    // 解除映射
    munmap(ptr, SIZE);

    // 關閉共享記憶體對象
    close(shm_fd);

    return 0;
}

