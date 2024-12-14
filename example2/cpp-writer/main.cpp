// main.cpp
/**
// 僅寫一次固定數值
#include "shared_memory_writer.h"
#include <iostream>
#include <vector>

int main() {
    const std::string name = "/my_shared_memory"; // 共享記憶體名稱
    const size_t dataSize = 2;                    // 要寫入的浮點數數量

    // 創建共享記憶體寫入器
    SharedMemoryWriter writer(name, dataSize);

    // 要寫入的浮點數數據
    std::vector<float> data = {1.55f, 2.66f};

    // 寫入共享記憶體
    if (!writer.writeData(data)) {
        std::cerr << "寫入共享記憶體失敗" << std::endl;
        return 1;
    }

    return 0;
}
**/

#include "shared_memory_writer.h"
#include <iostream>
#include <vector>
#include <cstdlib>   // 用於 rand() 函數
#include <ctime>     // 用於 time() 函數
#include <chrono>
#include <thread>

/**
本程式會每100ms隨機寫dataSize個數值
**/

int main() {
    const std::string name = "/my_shared_memory"; // 共享記憶體名稱
    const size_t dataSize = 2;                    // 要寫入的浮點數數量（2 個）
    float data[dataSize] = {0.0};
    

    // 創建共享記憶體寫入器
    SharedMemoryWriter writer(name, sizeof(data), data);

    // 初始化隨機數生成器
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    
    
    

    while (true) {
        // 產生兩個隨機浮點數
        data[0] = static_cast<float>(std::rand()) / (static_cast<float>(RAND_MAX / 100.0f));
        data[1] = static_cast<float>(std::rand()) / (static_cast<float>(RAND_MAX / 100.0f));

        // 寫入共享記憶體
        if (!writer.writeData()) {
            std::cerr << "寫入共享記憶體失敗" << std::endl;
            return 1;
        }

        // 輸出已寫入的數據
        std::cout << "已寫入隨機浮點數：" << data[0] << ", " << data[1] << std::endl;

        // 每隔 100 毫秒執行一次
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    return 0;
}