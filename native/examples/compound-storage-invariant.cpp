#include <iostream>
#include <mutex>
#include <thread>

int main() {
    int free = 8, used = 2;
    std::mutex mutex;
    auto allocate = [&] {
        std::lock_guard lock(mutex);
        if (free) {
            --free;
            ++used;
        }
    };
    std::jthread one(allocate), two(allocate);
    one.join();
    two.join();
    std::lock_guard lock(mutex);
    std::cout << "free=" << free << " used=" << used << " total=" << free + used
              << "\n";
}
