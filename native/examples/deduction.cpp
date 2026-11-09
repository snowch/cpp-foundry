#include <iostream>

template <class T> T maximum(T a, T b) {
    return a < b ? b : a;
}

int main() {
    std::cout << maximum(3, 7) << "\n";
    std::cout << maximum<double>(3, 7.5) << "\n";
}
