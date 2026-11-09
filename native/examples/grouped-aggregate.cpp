#include <iostream>
#include <map>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<int, int>> rows{{1, 10}, {2, 7}, {1, 20}};
    std::map<int, std::pair<unsigned, int>> groups;
    for (auto [key, value] : rows) {
        auto &state = groups[key];
        ++state.first;
        state.second += value;
    }
    for (auto [key, state] : groups)
        std::cout << key << " count=" << state.first << " sum=" << state.second << "\n";
}
