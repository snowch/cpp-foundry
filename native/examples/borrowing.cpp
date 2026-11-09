#include <iostream>
#include <span>
#include <string>
#include <string_view>
int main() {
    std::string text = "Ada Lovelace";
    std::string_view first(text.data(),3);
    std::cout << first << '\n';
    int values[]{10,20,30};
    std::span<int> middle(values + 1,1);
    middle[0] += 2;
    std::cout << values[1] << '\n';
    std::string copy(first);
    text.clear();
    std::cout << copy << '\n';
}
