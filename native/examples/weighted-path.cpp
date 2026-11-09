#include <functional>
#include <iostream>
#include <limits>
#include <queue>
#include <utility>
#include <vector>

int main() {
    using Edge = std::pair<unsigned, int>;
    const std::vector<std::vector<Edge>> graph{
        {{1, 5}, {2, 1}}, {{3, 1}}, {{1, 1}, {3, 9}}, {}};
    const int infinity = 1000000;
    std::vector<int> distance(graph.size(), infinity);
    distance[0] = 0;
    using Item = std::pair<int, unsigned>;
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> work;
    work.push({0, 0});
    while (!work.empty()) {
        auto [cost, node] = work.top();
        work.pop();
        if (cost != distance[node])
            continue;
        for (auto [next, weight] : graph[node])
            if (cost + weight < distance[next]) {
                distance[next] = cost + weight;
                work.push({distance[next], next});
            }
    }
    std::cout << distance[1] << " " << distance[3] << "\n";
}
