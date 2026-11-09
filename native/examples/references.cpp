#include <iostream>
#include <string>
void append_label(std::string& name) { name += " Lovelace"; }
std::string greeting(const std::string& name) { return "Hello, " + name; }
int main() {
    std::string name = "Ada";
    append_label(name);
    auto message = greeting(name);
    name.clear();
    std::cout << message << '\n';
    std::cout << "name empty=" << name.empty() << '\n';
}
