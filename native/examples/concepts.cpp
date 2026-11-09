#include <concepts>
#include <iostream>
#include <span>
template <std::integral T>
T total(std::span<const T> values) {
    T result{};
    for (T value : values) result += value;
    return result;
}
int main() {
    const int values[]{2,3,4};
    std::cout << total<int>(values) << '\n';
}
