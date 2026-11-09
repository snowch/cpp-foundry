#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

std::string manifest(const std::vector<std::pair<std::string, unsigned>> &entries) {
    std::map<std::string, unsigned> ordered(entries.begin(), entries.end());
    std::ostringstream out;
    for (const auto &[name, size] : ordered)
        out << name << "=" << size << "\n";
    return out.str();
}

int main() {
    const std::vector<std::pair<std::string, unsigned>> first{{"b.cpp", 7},
                                                              {"a.cpp", 12}},
        second{{"a.cpp", 12}, {"b.cpp", 7}};
    std::cout << "deterministic=" << (manifest(first) == manifest(second)) << "\n";
}
