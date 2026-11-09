#include <array>
#include <iostream>

int main() {
    const std::array<unsigned char, 4> header{'C', 'P', 'F', '2'};
    bool accepted = header == std::array<unsigned char, 4>{'C', 'P', 'F', '1'};
    unsigned live_rows = 3;
    if (accepted)
        live_rows = 0;
    std::cout << "accepted=" << accepted << " retained=" << live_rows << "\n";
}
