#include <iostream>
#include <stack>

int main() {
    std::stack<int> work;
    work.push(1);
    work.push(2);
    work.push(3);
    while (!work.empty()) {
        std::cout << work.top();
        work.pop();
    }
    std::cout << "\n";
}
