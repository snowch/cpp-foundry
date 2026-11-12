#include <future>
#include <iostream>
#include <stdexcept>

int main() {
  std::packaged_task<int()> task(
      []() -> int { throw std::runtime_error("task failed"); });
  auto result = task.get_future();
  task();
  try {
    std::cout << result.get();
  } catch (const std::runtime_error &e) {
    std::cout << e.what();
  }
}
