#include <iostream>
#include <memory>

int main() {
    std::weak_ptr<int> observer;
    {
        auto owner = std::make_shared<int>(7);
        observer = owner;
        if (auto held = observer.lock())
            std::cout << *held << "\n";
    }
    std::cout << "expired=" << observer.expired() << "\n";
}
