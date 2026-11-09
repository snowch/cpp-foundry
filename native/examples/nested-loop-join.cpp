#include <iostream>
#include <string>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<int, std::string>> left{{1, "A"}, {2, "B"}},
        right{{1, "X"}, {1, "Y"}};
    for (const auto &a : left)
        for (const auto &b : right)
            if (a.first == b.first)
                std::cout << a.second << b.second << "\n";
}
