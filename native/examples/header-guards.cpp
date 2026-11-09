#include <iostream>

#ifndef CPP_FOUNDRY_SCORE_HPP
#define CPP_FOUNDRY_SCORE_HPP
inline int clamp_score(int value) {
    return value < 0 ? 0 : value > 100 ? 100 : value;
}
#endif

int main() {
    std::cout << clamp_score(120) << "\n";
}
