#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    const std::vector<int> scores{95, 95, 95, 20, 10};
    unsigned old_estimate = 1;
    auto observed = std::count_if(scores.begin(), scores.end(),
                                  [](int score) { return score >= 90; });
    std::cout << "old=" << old_estimate << " refreshed=" << observed << "\n";
}
