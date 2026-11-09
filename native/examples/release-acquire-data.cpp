#include <array>
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::array<int, 2> values{};
    std::atomic<bool> ready{false};
    int result = 0;
    std::jthread reader([&] {
        while (!ready.load(std::memory_order_acquire))
            std::this_thread::yield();
        result = values[0] + values[1];
    });
    values = {20, 22};
    ready.store(true, std::memory_order_release);
    reader.join();
    std::cout << "batch=" << result << "\n";
}
