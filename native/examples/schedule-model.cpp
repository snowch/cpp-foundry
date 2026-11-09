#include <array>
#include <iostream>

int main() {
    unsigned accepted = 0;
    for (auto order : std::array<std::array<unsigned, 2>, 2>{{{0, 1}, {1, 0}}}) {
        unsigned revision = 0, commits = 0;
        std::array<unsigned, 2> base{0, 0};
        for (auto client : order)
            if (base[client] == revision) {
                ++revision;
                ++commits;
            }
        if (commits == 1)
            ++accepted;
    }
    std::cout << "orders=" << accepted << "\n";
    return accepted == 2 ? 0 : 1;
}
