#include <iostream>
#include <string>
#include <vector>

struct Report {
    std::vector<std::string> names;
};

int main() {
    Report first{{"Ada", "Grace"}};
    Report copy = first;
    copy.names[0] = "Changed";
    std::cout << first.names[0] << " " << copy.names[0] << "\n";
}
