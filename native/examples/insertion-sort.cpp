#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{4, 1, 3, 2};
    unsigned shifts = 0;
    for (std::size_t i = 1; i < values.size(); ++i) {
        int key = values[i];
        auto j = i;
        while (j > 0 && key < values[j - 1]) {
            values[j] = values[j - 1];
            --j;
            ++shifts;
        }
        values[j] = key;
    }
    for (int value : values)
        std::cout << value;
    std::cout << " shifts=" << shifts << "\n";
}
