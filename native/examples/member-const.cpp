#include <iostream>

class Counter {
    int count_;

  public:
    explicit Counter(int count) : count_(count) {
    }
    int value() const {
        return count_;
    }
};

int main() {
    const Counter counter{3};
    std::cout << counter.value() << "\n";
}
