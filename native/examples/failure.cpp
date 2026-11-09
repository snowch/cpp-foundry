#include <iostream>
#include <stdexcept>
#include <string>
void rename(std::string& current, const std::string& next) {
    std::string candidate = next;
    if (candidate.empty()) throw std::invalid_argument("empty name");
    current.swap(candidate);
}
int main() {
    std::string name = "Ada";
    try { rename(name,""); }
    catch (const std::invalid_argument& error) { std::cout << error.what() << '\n'; }
    std::cout << "preserved=" << name << '\n';
    rename(name,"Grace");
    std::cout << "committed=" << name << '\n';
}
