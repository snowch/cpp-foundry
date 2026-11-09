#include <cstdint>
#include <iostream>
#include <optional>
#include <utility>

std::optional<std::uint8_t> narrow(unsigned value) {
    if (!std::in_range<std::uint8_t>(value))
        return std::nullopt;
    return static_cast<std::uint8_t>(value);
}

int main() {
    for (unsigned value : {255u, 256u}) {
        auto result = narrow(value);
        std::cout << value << ":" << bool(result) << "\n";
    }
}
