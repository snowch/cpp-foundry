#include <iostream>
#include <vector>

void visit(const std::vector<std::vector<unsigned>> &graph, unsigned node,
           std::vector<bool> &seen) {
    if (seen.at(node))
        return;
    seen[node] = true;
    std::cout << node;
    for (auto next : graph[node])
        visit(graph, next, seen);
}

int main() {
    const std::vector<std::vector<unsigned>> graph{{1, 2}, {2}, {0}};
    std::vector<bool> seen(graph.size());
    visit(graph, 0, seen);
    std::cout << "\n";
}
