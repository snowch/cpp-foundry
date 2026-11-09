#include <iostream>
#include <string>
#include <string_view>

std::string make_name() {
    return "Ada Lovelace";
}

int main() {
    std::string owner = make_name();
    std::string_view view = owner;
    std::cout << view << "\n";
}
