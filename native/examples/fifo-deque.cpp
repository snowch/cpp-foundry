#include <deque>
#include <iostream>

int main() {
    std::deque<int> pending{10, 20};
    pending.push_back(30);
    while (!pending.empty()) {
        std::cout << pending.front() << " ";
        pending.pop_front();
    }
    std::cout << "empty=" << pending.empty() << "\n";
}
