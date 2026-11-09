#include <iostream>
#include <string>

struct Plan {
    std::string path;
    unsigned traversal, matches;
};

int main() {
    Plan plan{"index(id)", 3, 2};
    std::cout << plan.path
              << " predicate=id=7 estimated=" << plan.traversal + plan.matches << "\n";
}
