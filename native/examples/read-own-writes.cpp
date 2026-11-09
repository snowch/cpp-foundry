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
    auto transaction = store.begin();
    transaction.rows[3] = 30;
    std::cout << "own=" << transaction.rows.contains(3)
              << " external=" << store.rows.contains(3) << "\n";
}
