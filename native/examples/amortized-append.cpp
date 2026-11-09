#include <iostream>

int main() {
    unsigned capacity = 0, copied = 0;
    for (unsigned length = 0; length < 9; ++length)
        if (length == capacity) {
            copied += length;
            capacity = capacity ? capacity * 2 : 1;
        }
    std::cout << "appends=9 copied=" << copied << " capacity=" << capacity << "\n";
}
