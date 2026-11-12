#include <iostream>
#include <optional>
#include <string>

int main() {
  std::optional<std::string> name;
  std::cout << name.has_value() << " " << name.value_or("unknown");
  name = "Ada";
  std::cout << " " << name.value();
}
