#include <filesystem>
#include <iostream>
#include <system_error>

int main() {
  std::error_code ec;
  auto here = std::filesystem::current_path(ec);
  bool valid = !ec && !here.empty();
  std::cout << valid;
}
