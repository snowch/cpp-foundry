#include <iostream>
#include <optional>
#include <string_view>

std::optional<std::string_view> slice(std::string_view text, std::size_t start,
                                      std::size_t length) {
    if (start > text.size() || length > text.size() - start)
        return std::nullopt;
    return text.substr(start, length);
}

int main() {
    auto part = slice("Lovelace", 0, 4);
    if (part)
        std::cout << *part << "\n";
    std::cout << "rejected=" << !slice("Ada", 2, 9) << "\n";
}
