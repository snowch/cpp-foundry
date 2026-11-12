#include <iostream>
#include <iterator>
#include <numeric>
#include <sstream>

int main() {
  std::istringstream input("3 4 5");
  std::istream_iterator<int> first(input), last;
  std::cout << std::accumulate(first, last, 0);
}
