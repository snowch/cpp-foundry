#include <iostream>
#include <map>
#include <stdexcept>
#include <utility>

struct Transaction {
    unsigned base;
    std::map<int, int> rows;
    bool active = true;
};
struct Store {
    unsigned revision = 0;
    std::map<int, int> rows{{1, 10}, {2, 20}};
    Transaction begin() const {
        return {revision, rows, true};
    }
    bool commit(Transaction &transaction) {
        if (!transaction.active || transaction.base != revision)
            return false;
        auto candidate = transaction.rows;
        rows.swap(candidate);
        ++revision;
        transaction.active = false;
        return true;
    }
};
void rollback(Transaction &transaction) {
    transaction.rows.clear();
    transaction.active = false;
}

int main() {
    Store store;
    auto first = store.begin(), stale = store.begin();
    first.rows.at(1) = 50;
    store.commit(first);
    stale.rows.at(2) = 80;
    std::cout << "stale=" << !store.commit(stale) << " retained=" << store.rows.at(1)
              << "," << store.rows.at(2) << "\n";
}
