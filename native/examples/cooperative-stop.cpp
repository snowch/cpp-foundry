#include <atomic>
#include <iostream>
#include <stop_token>
#include <thread>

int main() {
    std::atomic<bool> observed{false};
    std::jthread worker([&](std::stop_token token) {
        while (!token.stop_requested())
            std::this_thread::yield();
        observed.store(true);
    });
    worker.request_stop();
    worker.join();
    std::cout << "observed=" << observed.load() << "\n";
}
