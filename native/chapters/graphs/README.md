# Graphs and traversal

Represent adjacency and maintain visited/path state.

## Own adjacency lists and validate vertex IDs

An adjacency list stores one neighbor sequence per vertex. The graph owns those sequences; traversal borrows them. Decide whether edges are directed and whether duplicate edges or self-loops are permitted.

External vertex IDs must be validated before indexing. This fixture uses a small directed graph with vertices numbered from zero.

```cpp
#include <iostream>
#include <vector>

int main() {
    const std::vector<std::vector<unsigned>> graph{{1, 2}, {2}, {}};
    for (std::size_t vertex = 0; vertex < graph.size(); ++vertex)
        std::cout << vertex << ":" << graph[vertex].size() << " ";
    std::cout << "vertices=" << graph.size() << "\n";
}

```

Expected output:

```text
0:2 1:1 2:0 vertices=3
```

The out-degrees are two, one, and zero. An empty neighbor list is different from a missing vertex.

Pitfall: A neighbor ID outside the vertex range can become an invalid array access during traversal.

Question: Does an empty adjacency list mean the vertex is absent?

1. Yes
2. Only in a directed graph
3. No, it has no outgoing edges

Answer: 3. Vertex existence is determined by the outer representation.

Experiment: Add a validation pass checking every edge endpoint before traversal. Test a disconnected vertex and a self-loop.

## Breadth-first traversal discovers shortest hop counts

In an unweighted graph, breadth-first search uses a FIFO queue to discover vertices by increasing hop distance. Marking a vertex when enqueued prevents duplicate work through multiple incoming paths.

The distance vector doubles as visited state: minus one means undiscovered, while zero is the source distance.

```cpp
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

```

Expected output:

```text
0112
```

Vertices one and two are one hop from zero; vertex three is two hops away through either predecessor.

Pitfall: Marking visited only when dequeued can enqueue the same vertex many times.

Question: When is a new vertex marked here?

1. Only after all traversal finishes
2. When it is enqueued
3. Whenever a duplicate edge is seen

Answer: 2. Discovery establishes its shortest hop distance before enqueueing.

Experiment: Add cycles and duplicate edges and verify the traversal still terminates. Compare distance results with hand-drawn shortest paths.

## Depth-first traversal needs explicit visited state

Depth-first search follows one path before exploring siblings. In a graph, visited state prevents cycles from causing unbounded recursion. A tree-only traversal without visited state is not a general graph traversal.

This example uses a bounded recursive graph walk and prints a deterministic order defined by adjacency order.

```cpp
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

```

Expected output:

```text
012
```

The cycle back to zero stops because zero was marked before following its outgoing edges.

Pitfall: Unbounded recursion depth can exhaust the stack even when visited state prevents cycles.

Question: Why mark before visiting neighbors?

1. To sort all edges
2. To remove the source vertex
3. To stop a cycle from re-entering an active vertex

Answer: 3. The mark prevents recursive re-entry through a back edge.

Experiment: Rewrite the traversal with an explicit stack. State how pushing neighbors changes the observable visit order.

## Acyclic dependencies admit a topological order

A topological order places every directed dependency before its dependent. Kahn’s algorithm starts with zero-indegree vertices, removes their outgoing edges logically, and enqueues newly available vertices.

If fewer than all vertices are emitted, a directed cycle prevents a complete order. The algorithm must report that outcome instead of treating a partial result as complete.

```cpp
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

```

Expected output:

```text
0123 complete=1
```

The source becomes available first; its two dependents precede the final vertex that requires both.

Pitfall: A topological order is not guaranteed to be unique. Define a tie policy when reproducible output matters.

Question: What signals a cycle in this algorithm?

1. Any vertex has outgoing edges
2. More than one zero-indegree vertex exists
3. Fewer emitted vertices than the graph contains

Answer: 3. A remaining cycle prevents its vertices from reaching indegree zero.

Experiment: Add an edge from the last vertex back to the first and verify incomplete processing is reported.

## Weighted shortest paths require a compatible algorithm

Breadth-first hop counts do not minimize arbitrary edge weights. For nonnegative weights, Dijkstra’s algorithm repeatedly settles the smallest tentative distance using a priority queue. Stale queue entries must be skipped.

The teaching fixture uses small integer weights with a bounded total. A general interface must check distance addition and reject negative weights.

```cpp
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

```

Expected output:

```text
2 3
```

The cheaper path reaches vertex one through vertex two, then reaches vertex three with total cost three.

Pitfall: Negative edge weights invalidate Dijkstra’s settling argument.

Question: Which edge-weight assumption is required?

1. Nonnegative weights
2. All weights must equal one
3. Weights must be distinct

Answer: 1. The smallest tentative distance can be safely advanced under the nonnegative-weight assumption.

Experiment: Compare this result with all simple paths in the small fixture. Add input validation and checked distance addition before using external graph data.

## Chapter project

Implement reachability and shortest paths with independent fixtures.
