#include <iostream>

int twice(int value) {
    return value * 2;
}

int main() {
    int answer = twice(6);
    std::cout << answer << "\n";
    return 0;
}
