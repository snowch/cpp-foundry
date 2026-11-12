#include <iostream>
#include <string>
#include <unordered_map>

int main() {
  std::unordered_map<std::string, int> counts;
  counts.max_load_factor(0.7f);
  counts.reserve(20);
  ++counts["Ada"];
  ++counts["Ada"];
  counts.rehash(100);
  std::cout << counts.at("Ada") << " " << counts.contains("Grace");
}
