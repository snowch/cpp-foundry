#include <filesystem>
#include <iostream>

int main() {
    std::filesystem::path path("logs/../people.cpf");
    std::cout << path.lexically_normal().generic_string() << "\n";
}
