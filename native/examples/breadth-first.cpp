#include <iostream>
#include <queue>
#include <vector>

using Graph = std::vector<std::vector<std::size_t>>;
std::vector<int> distances(const Graph &graph, std::size_t start) {
    std::vector<int> result(graph.size(), -1);
    std::queue<std::size_t> work;
    result.at(start) = 0;
    work.push(start);
    while (!work.empty()) {
        auto node = work.front();
        work.pop();
        for (auto next : graph[node])
            if (result.at(next) < 0) {
                result[next] = result[node] + 1;
                work.push(next);
            }
    }
    return result;
}

int main() {
    Graph graph{{1, 2}, {3}, {3}, {}};
    for (int distance : distances(graph, 0))
        std::cout << distance;
    std::cout << "\n";
}
