#include <iostream>

void show(int) {
    std::cout << "integer\n";
}
void show(double) {
    std::cout << "floating\n";
}

int main() {
    show(7);
    show(7.5);
}
