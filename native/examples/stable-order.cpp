#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Row {
    int key;
    std::string label;
};

int main() {
    std::vector<Row> rows{{2, "A"}, {1, "B"}, {2, "C"}};
    std::stable_sort(rows.begin(), rows.end(),
                     [](const Row &a, const Row &b) { return a.key < b.key; });
    for (const auto &row : rows)
        std::cout << row.label;
    std::cout << "\n";
}
