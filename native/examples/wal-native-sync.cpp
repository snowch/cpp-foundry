#include <fcntl.h>
#include <iostream>
#include <unistd.h>

int main() {
    int fd = ::open("redo.log", O_WRONLY | O_CREAT | O_TRUNC, 0600);
    if (fd < 0)
        return 1;
    const char byte = 'x';
    bool written = ::write(fd, &byte, 1) == 1;
    bool synced = written && ::fsync(fd) == 0;
    bool closed = ::close(fd) == 0;
    std::cout << "write=" << written << " sync=" << synced << " close=" << closed
              << "\n";
    return written && synced && closed ? 0 : 1;
}
