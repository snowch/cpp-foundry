#include <iostream>
#include <optional>

int main() {
    int committed = 10;
    std::optional<int> pending = 99;
    int reader = committed;
    pending.reset();
    std::cout << "reader=" << reader << " committed=" << committed
              << " pending=" << bool(pending) << "\n";
}
