#include <iostream>
#include <type_traits>

template <class T> void print_kind(T) {
    if constexpr (std::is_integral_v<T>)
        std::cout << "integral\n";
    else
        std::cout << "other\n";
}

int main() {
    print_kind(3);
    print_kind(3.5);
}
