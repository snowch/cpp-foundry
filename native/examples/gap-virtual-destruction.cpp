#include <iostream>
#include <memory>

struct Base {
  inline static int destroyed = 0;
  virtual ~Base() { ++destroyed; }
  virtual int value() const = 0;
};
struct Derived : Base {
  inline static int destroyed = 0;
  ~Derived() override { ++destroyed; }
  int value() const override { return 7; }
};
int main() {
  {
    std::unique_ptr<Base> owner = std::make_unique<Derived>();
    std::cout << owner->value() << " ";
  }
  std::cout << Base::destroyed << " " << Derived::destroyed;
}
