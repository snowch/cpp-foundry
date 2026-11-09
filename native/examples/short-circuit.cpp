#include <iostream>
#include <vector>

int main() {
    std::vector<int> values;
    bool starts_with_seven = !values.empty() && values.front() == 7;
    std::cout << starts_with_seven << "\n";
    values.push_back(7);
    std::cout << (!values.empty() && values.front() == 7) << "\n";
}
