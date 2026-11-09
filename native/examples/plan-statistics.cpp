#include <iostream>

int main() {
    unsigned estimated_matches = 5, observed_matches = 500;
    std::cout << "estimated=" << estimated_matches << " observed=" << observed_matches
              << " ratio=" << observed_matches / estimated_matches << "\n";
}
