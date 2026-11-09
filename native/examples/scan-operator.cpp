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
    unsigned visited = 0;
    for (const auto &row : fixture) {
        ++visited;
        std::cout << row.id << " ";
    }
    std::cout << "visited=" << visited << "\n";
}
