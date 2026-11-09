#include <charconv>
#include <iostream>
#include <optional>
#include <string_view>
#include <system_error>
std::optional<unsigned> parse_id(std::string_view text) {
    unsigned value = 0;
    auto [end,error] = std::from_chars(text.data(),text.data()+text.size(),value);
    if (error != std::errc{} || end != text.data()+text.size() || value == 0)
        return std::nullopt;
    return value;
}
int main() {
    for (auto text : {"42","42x","-1","0","99999999999999999999"}) {
        auto value = parse_id(text);
        std::cout << text << ": " << (value ? "valid" : "invalid") << '\n';
    }
}
