#include <chrono>
#include <iostream>

int main() {
  using namespace std::chrono;
  milliseconds total = seconds(2) + milliseconds(750);
  std::cout << total.count() << " " << duration_cast<seconds>(total).count();
}
