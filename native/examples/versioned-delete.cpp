#include <algorithm>
#include <iostream>
#include <limits>
#include <optional>
#include <set>
#include <stdexcept>
#include <vector>

struct Version {
    unsigned begin, end;
    std::optional<int> value;
};
struct Versions {
    static constexpr unsigned forever = std::numeric_limits<unsigned>::max();
    unsigned clock = 1;
    std::vector<Version> rows{{1, forever, 10}};
    std::multiset<unsigned> active;
    unsigned snapshot() {
        active.insert(clock);
        return clock;
    }
    void release(unsigned stamp) {
        auto found = active.find(stamp);
        if (found == active.end())
            throw std::runtime_error("unknown snapshot");
        active.erase(found);
    }
    void write(std::optional<int> value) {
        if (clock == forever - 1)
            throw std::runtime_error("version limit");
        auto candidate = rows;
        candidate.back().end = clock + 1;
        candidate.push_back({clock + 1, forever, value});
        rows.swap(candidate);
        ++clock;
    }
    std::optional<int> read(unsigned snapshot) const {
        for (auto it = rows.rbegin(); it != rows.rend(); ++it)
            if (it->begin <= snapshot && snapshot < it->end)
                return it->value;
        return std::nullopt;
    }
    void collect() {
        unsigned oldest = active.empty() ? clock : *active.begin();
        std::erase_if(rows,
                      [&](const Version &version) { return version.end <= oldest; });
    }
};

int main() {
    Versions versions;
    auto old = versions.snapshot();
    versions.write(std::nullopt);
    std::cout << "old=" << *versions.read(old)
              << " current_missing=" << !versions.read(versions.clock) << "\n";
    versions.release(old);
}
