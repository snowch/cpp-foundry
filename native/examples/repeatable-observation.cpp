#include <iostream>

int main() {
    int committed = 10, snapshot = committed;
    int first = committed;
    committed = 20;
    int second = committed;
    std::cout << "read_committed=" << first << "," << second << " snapshot=" << snapshot
              << "," << snapshot << "\n";
}
