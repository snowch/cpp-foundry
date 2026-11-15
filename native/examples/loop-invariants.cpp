#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{3, 1, 4};
    int sum = 0;
    int i = 0;
    while (i < 3) {
        std::cout << i << ":" << sum << "\n";
        sum = sum + values[i];
        i = i + 1;
    }
    std::cout << "total=" << sum << "\n";
}
