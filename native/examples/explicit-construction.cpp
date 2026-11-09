#include <iostream>
#include <stdexcept>

class RowId {
    unsigned value_;

  public:
    explicit RowId(unsigned value) : value_(value) {
        if (!value)
            throw std::invalid_argument("zero ID");
    }
    unsigned value() const {
        return value_;
    }
};

int main() {
    RowId id{7};
    std::cout << id.value() << "\n";
}
