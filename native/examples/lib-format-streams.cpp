#include <iomanip>
#include <iostream>
#include <sstream>

int main() {
  std::ostringstream out;
  out << std::fixed << std::setprecision(2) << 1.25 << " " << 2.0;
  std::cout << out.str();
}
