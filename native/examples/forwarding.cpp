#include <functional>
#include <iostream>
#include <utility>

template <class F, class T> void invoke_once(F &&function, T &&value) {
    std::invoke(std::forward<F>(function), std::forward<T>(value));
}

int main() {
    int total = 0;
    auto add = [&](int value) { total += value; };
    invoke_once(add, 4);
    invoke_once([](int value) { std::cout << value << "\n"; }, 9);
    std::cout << total << "\n";
}
