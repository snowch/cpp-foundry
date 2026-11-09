#include <iostream>
#include <mutex>
#include <thread>
int main() {
    int count=0;
    std::mutex mutex;
    auto increment=[&] {
        for (int i=0;i<10000;++i) {
            std::lock_guard lock(mutex);
            ++count;
        }
    };
    std::jthread first(increment),second(increment);
    first.join(); second.join();
    std::cout << "count=" << count << '\n';
}
