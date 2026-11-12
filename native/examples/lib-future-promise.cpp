#include <future>
#include <iostream>
#include <thread>

int main() {
  std::promise<int> promise;
  auto result = promise.get_future();
  std::jthread worker([p = std::move(promise)]() mutable { p.set_value(42); });
  std::cout << result.get();
}
