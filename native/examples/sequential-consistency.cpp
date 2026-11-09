#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::atomic<int> a{0}, b{0};
    int first = 0, second = 0;
    std::jthread one([&] {
        a.store(1);
        first = b.load();
    });
    std::jthread two([&] {
        b.store(1);
        second = a.load();
    });
    one.join();
    two.join();
    bool allowed = !(first == 0 && second == 0);
    std::cout << "allowed=" << allowed << "\n";
    return allowed ? 0 : 1;
}
