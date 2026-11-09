#include <iostream>
#include <queue>
#include <vector>

int main() {
    const std::vector<std::vector<unsigned>> graph{{1, 2}, {3}, {3}, {}};
    std::vector<unsigned> degree(graph.size());
    for (const auto &edges : graph)
        for (auto next : edges)
            ++degree.at(next);
    std::queue<unsigned> ready;
    for (unsigned i = 0; i < degree.size(); ++i)
        if (!degree[i])
            ready.push(i);
    unsigned count = 0;
    while (!ready.empty()) {
        auto node = ready.front();
        ready.pop();
        std::cout << node;
        ++count;
        for (auto next : graph[node])
            if (--degree[next] == 0)
                ready.push(next);
    }
    std::cout << " complete=" << (count == graph.size()) << "\n";
}
