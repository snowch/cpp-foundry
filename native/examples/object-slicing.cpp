#include <iostream>

struct Base {
    virtual ~Base() = default;
    virtual int kind() const {
        return 1;
    }
};
struct Derived : Base {
    int kind() const override {
        return 2;
    }
};

int main() {
    Derived derived;
    Base sliced = derived;
    const Base &borrowed = derived;
    std::cout << sliced.kind() << " " << borrowed.kind() << "\n";
}
