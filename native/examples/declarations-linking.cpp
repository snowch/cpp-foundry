#include <iostream>

int square(int value);
int square(int value) {
    return value * value;
}

int main() {
    std::cout << square(6) << "\n";
}
