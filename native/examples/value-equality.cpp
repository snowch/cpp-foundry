#include <iostream>
#include <string>

struct Row {
    unsigned id;
    std::string name;
    unsigned score;
    bool operator==(const Row &) const = default;
};

int main() {
    Row a{1, "Ada", 90}, b{1, "Ada", 90}, c{1, "Ada", 95};
    std::cout << (a == b) << " " << (a == c) << "\n";
}
