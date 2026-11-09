#include <iostream>
#include <stdexcept>
struct Guard {
    Guard() { std::cout << "acquire\n"; }
    ~Guard() { std::cout << "release\n"; }
};
void work() {
    Guard guard;
    std::cout << "work\n";
    throw std::runtime_error("failed");
}
int main() {
    try { work(); }
    catch (const std::runtime_error& error) { std::cout << error.what() << '\n'; }
}
