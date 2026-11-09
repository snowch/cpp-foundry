#include <array>
#include <iostream>
#include <span>

bool recognized(std::span<const unsigned char> bytes) {
    return bytes.size() >= 4 && bytes[0] == 'C' && bytes[1] == 'P' && bytes[2] == 'F' &&
           bytes[3] == '1';
}

int main() {
    const std::array<unsigned char, 4> good{'C', 'P', 'F', '1'},
        future{'C', 'P', 'F', '2'};
    std::cout << recognized(good) << " " << recognized(future) << "\n";
}
