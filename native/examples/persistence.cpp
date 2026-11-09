#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
int main() {
    {
        std::ofstream out("snapshot.txt",std::ios::binary|std::ios::trunc);
        if (!out) throw std::runtime_error("open failed");
        out << "1 Ada 90\n";
        out.close();
        if (!out) throw std::runtime_error("write or close failed");
    }
    std::ifstream in("snapshot.txt",std::ios::binary);
    std::string line;
    if (!std::getline(in,line)) throw std::runtime_error("read failed");
    std::cout << "reopened: " << line << '\n';
}
