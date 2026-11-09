#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::atomic<unsigned> count{0};
    auto work = [&] {
        for (unsigned i = 0; i < 10000; ++i)
            count.fetch_add(1, std::memory_order_relaxed);
    };
    std::jthread first(work), second(work);
    first.join();
    second.join();
    std::cout << "count=" << count.load() << "\n";
}
