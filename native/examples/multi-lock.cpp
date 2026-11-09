#include <iostream>
#include <mutex>
#include <thread>

int main() {
    int a = 10, b = 20;
    std::mutex first, second;
    auto transfer = [&] {
        std::scoped_lock lock(first, second);
        --a;
        ++b;
    };
    std::jthread one(transfer), two(transfer);
    one.join();
    two.join();
    std::cout << a << " " << b << " total=" << a + b << "\n";
}
