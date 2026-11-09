#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
};
const std::vector<Row> fixture{{1, "Ada", 90}, {2, "Grace", 95}, {3, "Linus", 70}};

int main() {
    std::vector<Row> selected;
    for (const auto &row : fixture)
        if (row.score >= 90)
            selected.push_back(row);
    std::ranges::sort(selected, [](const Row &a, const Row &b) {
        return a.score == b.score ? a.id < b.id : a.score > b.score;
    });
    for (const auto &row : selected)
        std::cout << row.name << "\n";
}
