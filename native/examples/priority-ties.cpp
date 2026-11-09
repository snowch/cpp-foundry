#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

int main() {
    using Task = std::pair<int, int>;
    std::priority_queue<Task, std::vector<Task>, std::greater<Task>> tasks;
    tasks.push({2, 0});
    tasks.push({1, 2});
    tasks.push({1, 1});
    while (!tasks.empty()) {
        auto [priority, sequence] = tasks.top();
        tasks.pop();
        std::cout << priority << ":" << sequence << " ";
    }
    std::cout << "done\n";
}
