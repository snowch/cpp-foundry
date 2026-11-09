#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string bytes("A\0B", 3);
    std::istringstream input(bytes);
    char value;
    unsigned count = 0, zeros = 0;
    while (input.get(value)) {
        ++count;
        if (value == 0)
            ++zeros;
    }
    std::cout << "bytes=" << count << " zeros=" << zeros << "\n";
}
