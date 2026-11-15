#include <iostream>
#include <vector>

int main() {
    std::vector<int> scores{70, 80, 90};
    scores.push_back(100);
    for (int score : scores) {
        std::cout << score << "\n";
    }
    std::cout << "count=" << scores.size() << "\n";
    return 0;
}
