#include <iostream>
#include <memory>

int main() {
  std::weak_ptr<int> observer;
  {
    auto owner = std::make_shared<int>(7);
    observer = owner;
    if (auto locked = observer.lock())
      std::cout << *locked << " ";
  }
  std::cout << observer.expired();
}
