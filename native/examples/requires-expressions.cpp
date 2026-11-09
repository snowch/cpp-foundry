#include <concepts>
#include <iostream>
#include <vector>

template <class T>
concept Sized = requires(const T &value) {
    { value.size() } -> std::convertible_to<std::size_t>;
};
template <Sized T> std::size_t count(const T &value) {
    return value.size();
}

int main() {
    std::vector<int> values{1, 2, 3};
    std::cout << count(values) << "\n";
}
