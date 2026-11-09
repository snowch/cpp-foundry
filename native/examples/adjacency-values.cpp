#include <iostream>
#include <vector>

int main() {
    const std::vector<std::vector<unsigned>> graph{{1, 2}, {2}, {}};
    for (std::size_t vertex = 0; vertex < graph.size(); ++vertex)
        std::cout << vertex << ":" << graph[vertex].size() << " ";
    std::cout << "vertices=" << graph.size() << "\n";
}
