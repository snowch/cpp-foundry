#include <iostream>
#include <string>
#include <vector>
int main() {
    std::vector<std::string> names{"Ada", "Linus"};
    names.push_back("Grace");
    for (const auto& name : names) std::cout << name << '\n';
    std::cout << "count=" << names.size() << '\n';
}
