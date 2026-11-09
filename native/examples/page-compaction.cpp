#include <iostream>
#include <string>
#include <vector>

struct Slot {
    std::string text;
    bool live;
};

int main() {
    std::vector<Slot> slots{{"Ada", true}, {"deleted", false}, {"Grace", true}};
    std::string packed;
    std::vector<std::size_t> offsets;
    for (const auto &slot : slots)
        if (slot.live) {
            offsets.push_back(packed.size());
            packed += slot.text;
        }
    std::cout << packed << " offsets=" << offsets[0] << "," << offsets[1] << "\n";
}
