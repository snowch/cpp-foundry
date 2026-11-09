#include <iostream>

int main() {
    unsigned height = 3, matches = 8;
    std::cout << "covered=" << height + matches << " fetch=" << height + 3 * matches
              << "\n";
}
