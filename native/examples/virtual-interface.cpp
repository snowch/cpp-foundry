#include <iostream>

struct Store {
    virtual ~Store() = default;
    virtual int count() const = 0;
};
struct MemoryStore final : Store {
    int count() const override {
        return 3;
    }
};

int main() {
    MemoryStore store;
    const Store &interface = store;
    std::cout << interface.count() << "\n";
}
