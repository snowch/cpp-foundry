#include <iostream>
#include <numeric>
#include <vector>

int main() {
  std::vector<int> v{2, 3, 4}, prefix(3);
  auto sum = std::accumulate(v.begin(), v.end(), 0LL);
  std::inclusive_scan(v.begin(), v.end(), prefix.begin());
  std::cout << sum << " " << prefix[0] << " " << prefix[1] << " " << prefix[2];
}
