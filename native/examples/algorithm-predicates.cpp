#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> names{"Grace", "Ada", "Linus"};
    std::ranges::sort(names, [](const auto &a, const auto &b) {
        return a.size() == b.size() ? a < b : a.size() < b.size();
    });
    for (const auto &name : names)
        std::cout << name << "\n";
}
