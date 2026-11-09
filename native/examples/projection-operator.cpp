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
    std::vector<std::string> names;
    for (const auto &row : fixture)
        names.push_back(row.name);
    std::cout << names.at(0) << " fields=1\n";
}
