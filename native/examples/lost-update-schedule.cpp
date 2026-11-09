#include <iostream>

int main() {
    int committed = 10;
    int first_read = committed, second_read = committed;
    committed = first_read + 5;
    committed = second_read + 7;
    std::cout << "actual=" << committed << " intended=" << 10 + 5 + 7 << "\n";
}
