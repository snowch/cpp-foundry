#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    tree.insert(7);
    tree.erase(7);
    std::cout << "leaves=" << tree.leaves.size() << " empty=" << tree.leaves[0].empty()
              << " missing=" << !tree.erase(7) << " valid=" << tree.valid() << "\n";
}
