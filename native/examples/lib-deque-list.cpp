#include <deque>
#include <iostream>
#include <list>

int main() {
  std::deque<int> d{2};
  d.push_front(1);
  d.push_back(3);
  std::list<int> a{4, 5}, b{6};
  auto it = a.begin();
  b.splice(b.end(), a, it);
  std::cout << d.front() << " " << d.back() << " " << *it << " " << a.size();
}
