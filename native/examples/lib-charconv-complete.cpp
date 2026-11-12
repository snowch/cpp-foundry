#include <charconv>
#include <iostream>
#include <string_view>
#include <system_error>

int main() {
  for (std::string_view text : {"42", "42x", "99999999999999999999"}) {
    int n = 0;
    auto [end, ec] = std::from_chars(text.data(), text.data() + text.size(), n);
    std::cout << (ec == std::errc{} && end == text.data() + text.size()) << " ";
  }
}
