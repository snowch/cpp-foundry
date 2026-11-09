#include <iostream>

unsigned sum(unsigned n) {
    return n == 0 ? 0 : n + sum(n - 1);
}

int main() {
    std::cout << sum(4) << "\n";
}
