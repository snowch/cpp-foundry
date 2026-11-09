#include <iostream>

int main() {
    for (unsigned matches : {4u, 1000u}) {
        unsigned scan = 1000, index = 3 + 2 * matches;
        std::cout << matches << ":" << (index < scan ? "index" : "scan") << "\n";
    }
}
