#include <future>
#include <iostream>
#include <thread>

int main() {
  std::promise<int> promise;
  std::shared_future<int> result = promise.get_future().share();
  int a = 0, b = 0;
  std::jthread first([&] { a = result.get(); });
  std::jthread second([&] { b = result.get(); });
  promise.set_value(7);
  first.join();
  second.join();
  std::cout << a << " " << b;
}
