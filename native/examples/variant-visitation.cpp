#include <iostream>
#include <variant>

struct Scan {
    void explain() const {
        std::cout << "scan\n";
    }
};
struct Lookup {
    int id;
    void explain() const {
        std::cout << "lookup " << id << "\n";
    }
};

int main() {
    std::variant<Scan, Lookup> plan = Lookup{7};
    std::visit([](const auto &operation) { operation.explain(); }, plan);
}
