#include <iostream>
#include <optional>
#include <utility>
#include <vector>

struct MinHeap {
    std::vector<int> values;
    void push(int value) {
        values.push_back(value);
        auto at = values.size() - 1;
        while (at > 0) {
            auto parent = (at - 1) / 2;
            if (values[parent] <= values[at])
                break;
            std::swap(values[parent], values[at]);
            at = parent;
        }
    }
    std::optional<int> pop() {
        if (values.empty())
            return std::nullopt;
        int result = values.front();
        values.front() = values.back();
        values.pop_back();
        std::size_t at = 0;
        while (at < values.size()) {
            auto child = at * 2 + 1;
            if (child >= values.size())
                break;
            if (child + 1 < values.size() && values[child + 1] < values[child])
                ++child;
            if (values[at] <= values[child])
                break;
            std::swap(values[at], values[child]);
            at = child;
        }
        return result;
    }
    bool valid() const {
        for (std::size_t i = 1; i < values.size(); ++i)
            if (values[(i - 1) / 2] > values[i])
                return false;
        return true;
    }
};

int main() {
    MinHeap heap;
    for (int value : {5, 2, 8, 1})
        heap.push(value);
    std::cout << "minimum=" << heap.values.front() << " valid=" << heap.valid() << "\n";
}
