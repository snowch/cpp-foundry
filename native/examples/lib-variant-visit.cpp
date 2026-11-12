#include <iostream>
#include <string>
#include <type_traits>
#include <variant>

int main() {
  std::variant<int, std::string> value = 7;
  auto show = [](const auto &item) {
    if constexpr (std::is_same_v<std::decay_t<decltype(item)>, int>)
      std::cout << "number=" << item;
    else
      std::cout << "text=" << item;
  };
  std::visit(show, value);
  value = std::string("Ada");
  std::cout << " ";
  std::visit(show, value);
}
