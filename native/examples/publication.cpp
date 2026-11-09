#include <atomic>
#include <iostream>
#include <thread>
#include <vector>
int main() {
    std::vector<int> values;
    std::atomic<bool> ready{false};
    int observed=0;
    std::jthread reader([&] {
        while (!ready.load(std::memory_order_acquire)) std::this_thread::yield();
        for (int value:values) observed += value;
    });
    values={10,20,30};
    ready.store(true,std::memory_order_release);
    reader.join();
    std::cout << "snapshot sum=" << observed << '\n';
}
