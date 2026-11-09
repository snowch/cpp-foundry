#include <iostream>
#include <string>
#include <variant>
using Result = std::variant<unsigned,std::string>;
Result score(int value) {
    if (value < 0 || value > 100) return std::string("score outside 0..100");
    return static_cast<unsigned>(value);
}
int main() {
    for (int value : {90,101}) {
        Result result = score(value);
        std::visit([](const auto& item) { std::cout << item << '\n'; },result);
    }
}
