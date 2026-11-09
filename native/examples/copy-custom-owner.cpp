#include <iostream>
#include <memory>
#include <utility>

class Box {
    std::unique_ptr<int> value_;

  public:
    explicit Box(int value) : value_(std::make_unique<int>(value)) {
    }
    Box(const Box &other) : Box(other.get()) {
    }
    Box &operator=(const Box &other) {
        Box candidate(other);
        value_.swap(candidate.value_);
        return *this;
    }
    int get() const {
        return *value_;
    }
    void set(int value) {
        *value_ = value;
    }
};

int main() {
    Box first{5};
    Box copy = first;
    copy.set(9);
    std::cout << first.get() << " " << copy.get() << "\n";
}
