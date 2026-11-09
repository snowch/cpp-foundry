#include <iostream>
#include <optional>

int main() {
    std::optional<int> zero = 0, missing;
    std::cout << "present=" << bool(zero) << " value=" << *zero << "\n";
    std::cout << "missing=" << !missing << " fallback=" << missing.value_or(-1) << "\n";
}
