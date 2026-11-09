#include <atomic>
#include <iostream>

int main() {
    std::atomic<int> value{7};
    int expected = 5;
    bool changed = value.compare_exchange_strong(expected, 9);
    std::cout << "changed=" << changed << " expected=" << expected
              << " value=" << value.load() << "\n";
}
