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

