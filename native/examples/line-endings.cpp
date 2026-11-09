#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::istringstream input("LIST\r\nSAVE\n");
    std::string line;
    while (std::getline(input, line)) {
        if (!line.empty() && line.back() == '\r')
            line.pop_back();
        std::cout << "[" << line << "]\n";
    }
}
