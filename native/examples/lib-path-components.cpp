#include <filesystem>
#include <iostream>

int main() {
  std::filesystem::path p("alpha/../beta/file.txt");
  auto normalized = p.lexically_normal();
  std::cout << normalized.filename().string() << " "
            << normalized.extension().string();
}
