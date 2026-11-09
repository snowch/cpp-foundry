#include <iostream>

enum class Status { inserted, duplicate, full };

int main() {
    Status result = Status::duplicate;
    std::cout << (result == Status::duplicate ? "duplicate" : "other") << "\n";
}
