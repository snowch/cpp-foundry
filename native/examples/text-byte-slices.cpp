#include <iomanip>
#include <iostream>
#include <string>

int main() {
    std::string text = "ë";
    std::cout << "bytes=" << text.size() << " lead=" << std::hex
              << unsigned(static_cast<unsigned char>(text[0]))
              << " continuation=" << unsigned(static_cast<unsigned char>(text[1]))
              << "\n";
}
