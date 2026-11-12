#include <iostream>
#include <limits>
#include <sstream>
#include <string>

int main() {
  std::istringstream input("bad\n42\n");
  int value = 0;
  input >> value;
  std::cout << input.fail() << " ";
  input.clear();
  input.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
  input >> value;
  std::cout << value;
}
