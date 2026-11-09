#include <iostream>
#include <stdexcept>

struct Guard {
    int &count;
    explicit Guard(int &value) : count(value) {
        ++count;
    }
    ~Guard() {
        --count;
    }
};

int main() {
    int live = 10, owners = 0;
    try {
        Guard guard(owners);
        int candidate = 99;
        if (candidate == 99)
            throw std::runtime_error("injected");
        live = candidate;
    } catch (const std::exception &) {
        std::cout << "rejected ";
    }
    std::cout << "live=" << live << " owners=" << owners << "\n";
}
