#include <iostream>

int main() {
    for (unsigned n : {4u, 8u}) {
        unsigned levels = 0;
        for (unsigned m = n; m > 1; m /= 2)
            ++levels;
        std::cout << n << " log=" << levels << " linear=" << n << " square=" << n * n
                  << "\n";
    }
}
