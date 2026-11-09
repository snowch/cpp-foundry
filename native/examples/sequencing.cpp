#include <iostream>

int main() {
    int value = 1;
    int before = value;
    ++value;
    int after = value;
    std::cout << before << " " << after << "\n";
}
