#include <iostream>

int main() {
    unsigned previous = 0, current = 1;
    for (unsigned n = 0; n < 10; ++n) {
        auto next = previous + current;
        previous = current;
        current = next;
    }
    std::cout << previous << "\n";
}
