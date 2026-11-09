#include <iostream>
#include <thread>

int main() {
    int result = 0;
    std::jthread worker([&] { result = 42; });
    worker.join();
    std::cout << "joined=" << result << "\n";
}
