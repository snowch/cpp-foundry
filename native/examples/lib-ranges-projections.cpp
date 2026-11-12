#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Row {
  std::string name;
  int score;
};
int main() {
  std::vector<Row> rows{{"Ada", 3}, {"Grace", 1}};
  std::ranges::sort(rows, {}, &Row::score);
  for (const auto &r : rows)
    std::cout << r.name << " ";
}
