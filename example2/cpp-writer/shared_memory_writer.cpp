// shared_memory_writer.cpp

#include "shared_memory_writer.h"
#include <iostream>
#include <sys/mman.h>
#include <sys/stat.h> /* For mode constants */
#include <fcntl.h>    /* For O_* constants */
#include <unistd.h>
#include <cstring>

SharedMemoryWriter::SharedMemoryWriter(const std::string& name, size_t shm_size, void* ptr_share_data)
    : shm_name(name), shm_fd(-1), ptr(nullptr), ptr_share_data(ptr_share_data), shm_size(shm_size)
{
    // 創建共享記憶體對象
    shm_fd = shm_open(shm_name.c_str(), O_CREAT | O_RDWR, 0666);
    if (shm_fd == -1) {
        std::cerr << "共享記憶體創建失敗" << std::endl;
        throw std::runtime_error("共享記憶體創建失敗");
    }

    // 設置共享記憶體大小
    if (ftruncate(shm_fd, shm_size) == -1) {
        std::cerr << "設定共享記憶體大小失敗" << std::endl;
        close(shm_fd);
        throw std::runtime_error("設定共享記憶體大小失敗");
    }

    // 映射共享記憶體
    ptr = mmap(0, shm_size, PROT_WRITE, MAP_SHARED, shm_fd, 0);
    if (ptr == MAP_FAILED) {
        std::cerr << "共享記憶體映射失敗" << std::endl;
        close(shm_fd);
        throw std::runtime_error("共享記憶體映射失敗");
    }
}

SharedMemoryWriter::~SharedMemoryWriter()
{
    // 解除映射
    if (ptr != nullptr && ptr != MAP_FAILED) {
        munmap(ptr, shm_size);
    }

    // 關閉共享記憶體對象
    if (shm_fd != -1) {
        close(shm_fd);
    }

    // 刪除共享記憶體對象（如有需要，可以註釋掉）
    //shm_unlink(shm_name.c_str());
}

bool SharedMemoryWriter::writeData()
{
    if (ptr == nullptr || ptr == MAP_FAILED || ptr_share_data == nullptr) {
        std::cerr << "寫入共享記憶體失敗: 無效的記憶體指標" << std::endl;
        return false;
    }
    // 寫入共享記憶體
    memcpy(ptr, ptr_share_data, shm_size);
    /**std::cout << "已寫入浮點數：" << std::endl;
    for (const auto& val : data) {
        std::cout << val << " ";
    }
    std::cout << std::endl;
    **/
    return true;
}
