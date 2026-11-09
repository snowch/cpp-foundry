#include <iostream>

int main() {
    unsigned remaining = 13, steps = 0;
    while (remaining != 0) {
        std::cout << remaining << " ";
        remaining /= 2;
        ++steps;
    }
    std::cout << "steps=" << steps << "\n";
}
