#include <iostream>
#include <map>
#include <mutex>
#include <utility>

class Store {
    mutable std::mutex mutex_;
    unsigned revision_ = 0;
    std::map<unsigned, int> rows_{{1, 10}};

  public:
    std::pair<unsigned, int> read(unsigned id) const {
        std::lock_guard lock(mutex_);
        return {revision_, rows_.at(id)};
    }
    bool update(unsigned id, int value, unsigned expected) {
        std::lock_guard lock(mutex_);
        if (revision_ != expected)
            return false;
        rows_.at(id) = value;
        ++revision_;
        return true;
    }
};

int main() {
    Store store;
    auto first = store.read(1), stale = first;
    bool accepted = store.update(1, 20, first.first);
    bool rejected = !store.update(1, 30, stale.first);
    std::cout << accepted << " " << rejected << " value=" << store.read(1).second
              << "\n";
}
