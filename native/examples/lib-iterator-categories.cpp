#include <iostream>
#include <iterator>
#include <list>
#include <vector>

int main() {
  std::vector<int> v{2, 4, 6};
  std::list<int> l{2, 4, 6};
  auto it = l.begin();
  std::advance(it, 2);
  std::cout << v.end() - v.begin() << " " << *it;
}
