#include <iostream>
#include <map>
#include <string>
int main() {
    std::map<int,std::string> names;
    auto [position, inserted] = names.try_emplace(1,"Ada");
    std::cout << "inserted=" << inserted << '\n';
    auto duplicate = names.try_emplace(1,"Grace");
    std::cout << "duplicate=" << !duplicate.second << '\n';
    std::cout << position->second << '\n';
    std::cout << "missing=" << (names.find(9) == names.end()) << '\n';
    std::cout << "size=" << names.size() << '\n';
}
