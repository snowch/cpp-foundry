#include <iostream>
#include <mutex>
#include <shared_mutex>
#include <thread>

int main() {
    std::shared_mutex mutex;
    int value = 7, first = 0, second = 0;
    std::jthread one([&] {
        std::shared_lock lock(mutex);
        first = value;
    });
    std::jthread two([&] {
        std::shared_lock lock(mutex);
        second = value;
    });
    one.join();
    two.join();
    {
        std::unique_lock lock(mutex);
        value = 9;
    }
    std::cout << first << " " << second << " final=" << value << "\n";
}
