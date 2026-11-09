#include <iostream>
#include <map>
#include <string>
struct Row { std::string name; unsigned score; };
int main() {
    std::map<unsigned,Row> rows;
    auto inserted = rows.try_emplace(1,Row{"Ada",90});
    auto duplicate = rows.try_emplace(1,Row{"Wrong",0});
    std::cout << "inserted=" << inserted.second << '\n';
    std::cout << "duplicate=" << !duplicate.second << '\n';
    if (auto found = rows.find(1); found != rows.end()) found->second.score = 95;
    std::cout << rows.at(1).name << ' ' << rows.at(1).score << '\n';
    std::cout << "removed=" << rows.erase(1) << '\n';
    std::cout << "count=" << rows.size() << '\n';
}
