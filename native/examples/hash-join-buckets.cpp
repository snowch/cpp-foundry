#include <iostream>
#include <map>
#include <string>
#include <utility>
#include <vector>

int main() {
    const std::vector<std::pair<int, std::string>> build{{1, "X"}, {1, "Y"}, {3, "Z"}};
    std::map<int, std::vector<std::string>> buckets;
    for (const auto &[key, value] : build)
        buckets[key].push_back(value);
    for (const auto &value : buckets.at(1))
        std::cout << "A" << value << "\n";
}
