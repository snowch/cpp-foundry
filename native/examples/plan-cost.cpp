#include <iostream>

int main() {
    unsigned rows = 1000, height = 3, matches = 4;
    unsigned scan = rows, index = height + matches;
    std::cout << "scan=" << scan << " index=" << index
              << " choose=" << (index < scan ? "index" : "scan") << "\n";
}
