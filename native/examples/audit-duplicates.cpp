#include <iostream>
#include <set>
#include <vector>

int main() {
    const std::vector<unsigned> imported{1, 2, 1};
    std::set<unsigned> candidate;
    bool accepted = true;
    for (auto id : imported)
        if (!candidate.insert(id).second) {
            accepted = false;
            break;
        }
    unsigned live_count = 4;
    if (accepted)
        live_count = static_cast<unsigned>(candidate.size());
    std::cout << "accepted=" << accepted << " retained=" << live_count << "\n";
}
