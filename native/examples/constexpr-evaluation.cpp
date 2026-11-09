#include <iostream>

constexpr int triangle(int n) {int total=0;for(int i=1;i<=n;++i)total+=i;return total;}

int main() {
    static_assert(triangle(4)==10);
    int input=5;
    std::cout << triangle(input) << "\n";
}
