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
    auto [revision, value] = store.read(1);
    std::cout << "revision=" << revision << " value=" << value << "\n";
}
