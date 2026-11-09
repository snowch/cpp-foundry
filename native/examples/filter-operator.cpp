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
    std::vector<unsigned> ids;
    for (const auto &row : fixture)
        if (row.score >= 90)
            ids.push_back(row.id);
    for (auto id : ids)
        std::cout << id;
    std::cout << " source=" << fixture.size() << "\n";
}
