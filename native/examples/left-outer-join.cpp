#include <iostream>
#include <map>
#include <optional>
#include <string>

int main() {
    const std::map<int, std::string> right{{1, "X"}};
    for (int key : {1, 2}) {
        std::optional<std::string> matched;
        auto found = right.find(key);
        if (found != right.end())
            matched = found->second;
        std::cout << key << ":" << matched.value_or("<missing>") << "\n";
    }
}
