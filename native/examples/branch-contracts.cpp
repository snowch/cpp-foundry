#include <iostream>

int main() {
    for (int score : {59, 60, 100}) {
        if (score >= 60)
            std::cout << "pass\n";
        else
            std::cout << "retry\n";
    }
}
