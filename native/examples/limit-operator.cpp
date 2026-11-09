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
    unsigned visited = 0, emitted = 0;
    const unsigned limit = 2;
    for (const auto &row : fixture) {
        if (emitted == limit)
            break;
        ++visited;
        if (row.score >= 80) {
            std::cout << row.id;
            ++emitted;
        }
    }
    std::cout << " visited=" << visited << "\n";
}
