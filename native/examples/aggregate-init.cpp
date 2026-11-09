#include <iostream>
#include <string>

struct Person {
    unsigned id;
    std::string name;
    unsigned score = 0;
};

int main() {
    Person first{1, "Ada", 90};
    Person second{2, "Grace"};
    std::cout << first.name << " " << first.score << "\n";
    std::cout << second.name << " " << second.score << "\n";
}
