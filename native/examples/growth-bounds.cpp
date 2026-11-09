#include <iostream>

int main() {
    for (unsigned n : {1u, 2u, 4u})
        std::cout << n << ":" << 3 * n + 2 << " <= " << 5 * n << "\n";
}
