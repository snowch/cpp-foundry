#include <iostream>
#include <map>
#include <string>

int main() {
  std::map<std::string, int> m;
  auto [it, added] = m.try_emplace("Ada", 2);
  auto again = m.try_emplace("Ada", 9);
  std::cout << added << " " << again.second << " " << it->second << " "
            << m.contains("Grace");
}
