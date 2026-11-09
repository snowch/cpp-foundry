#include <iostream>
#include <memory>

struct Base {
    virtual ~Base() {
        std::cout << "base\n";
    }
};
struct Derived : Base {
    ~Derived() override {
        std::cout << "derived\n";
    }
};

int main() {
    std::unique_ptr<Base> owner = std::make_unique<Derived>();
    owner.reset();
}
