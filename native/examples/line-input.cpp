#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::istringstream input("LIST\n\nSAVE\n");
    std::string line;
    while (std::getline(input, line))
        std::cout << "[" << line << "]\n";
}
