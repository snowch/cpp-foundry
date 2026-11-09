#include <cstdint>
#include <iostream>
#include <string>
struct Row { std::uint32_t id; std::string name; unsigned score; };
bool valid(const Row& row) {
    return row.id != 0 && !row.name.empty() && row.name.size() <= 63 && row.score <= 100;
}
int main() {
    const Row good{1,"Ada",90};
    const Row bad{0,"",101};
    std::cout << "good=" << valid(good) << '\n';
    std::cout << "bad=" << valid(bad) << '\n';
}
