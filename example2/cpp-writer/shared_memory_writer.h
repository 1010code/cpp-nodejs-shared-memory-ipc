// shared_memory_writer.h

#ifndef SHARED_MEMORY_WRITER_H
#define SHARED_MEMORY_WRITER_H

#include <string>
#include <vector>

class SharedMemoryWriter {
public:
    SharedMemoryWriter(const std::string& name, size_t shm_size, void* ptr_share_data);
    ~SharedMemoryWriter();

    bool writeData();

private:
    std::string shm_name;
    size_t shm_size;
    int shm_fd;
    void* ptr;
    void* ptr_share_data;
};

#endif // SHARED_MEMORY_WRITER_H
