#include <format>
#include <iostream>
#include <string>

int main() {
  std::string text = std::format("id={:04d} score={:.1f}", 7, 2.5);
  std::cout << text;
}
