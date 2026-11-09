#include <iostream>
#include <vector>

struct Bounds {
    int minimum;
    int maximum;
};
Bounds bounds(const std::vector<int> &values) {
    int low = values.at(0), high = low;
    for (int value : values) {
        if (value < low)
            low = value;
        if (value > high)
            high = value;
    }
    return {low, high};
}

int main() {
    auto [minimum, maximum] = bounds({4, 2, 9});
    std::cout << minimum << " " << maximum << "\n";
}
