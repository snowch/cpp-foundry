#include <iostream>
#include <ranges>
#include <vector>
int main() {
    const std::vector<int> scores{40,70,90,50};
    auto passing = scores
        | std::views::filter([](int score) { return score >= 60; })
        | std::views::transform([](int score) { return score + 5; });
    for (int score : passing) std::cout << score << '\n';
    std::cout << "original=" << scores[1] << '\n';
}
