#include <iostream>
#include <optional>
#include <vector>
std::optional<double> mean(const std::vector<int>& scores) {
    if (scores.empty()) return std::nullopt;
    double total = 0;
    for (int score : scores) total += score;
    return total / static_cast<double>(scores.size());
}
int main() {
    const std::vector<int> scores{70, 80, 90};
    std::cout << "mean=" << *mean(scores) << '\n';
    std::cout << "empty=" << !mean({}) << '\n';
}
