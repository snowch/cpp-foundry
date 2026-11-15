#include <iostream>

int main() {
    int outer = 10;
    {
        int inner = 2;
        std::cout << outer + inner << "\n";
    }
    std::cout << outer << "\n";
    return 0;
}
