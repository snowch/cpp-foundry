#include <chrono>
#include <iostream>
#include <type_traits>

int main() {
  using Clock = std::chrono::steady_clock;
  constexpr bool steady = Clock::is_steady;
  std::chrono::time_point<Clock, std::chrono::milliseconds> start(
      std::chrono::milliseconds(100));
  auto end = start + std::chrono::milliseconds(25);
  std::cout << steady << " " << (end - start).count();
}
