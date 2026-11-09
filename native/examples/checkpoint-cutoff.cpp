#include <iostream>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<unsigned, int>> log{{1, 10}, {2, 20}, {3, 30}};
    unsigned covered = 2;
    int state = 20;
    for (auto [position, value] : log)
        if (position > covered)
            state = value;
    std::cout << "covered=" << covered << " recovered=" << state << "\n";
}
