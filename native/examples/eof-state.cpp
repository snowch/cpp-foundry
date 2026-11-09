#include <iostream>
#include <sstream>

int main() {
    std::istringstream input("AB");
    char value;
    unsigned count = 0;
    while (input.get(value))
        ++count;
    std::cout << "count=" << count << " eof=" << input.eof() << " bad=" << input.bad()
              << "\n";
}
