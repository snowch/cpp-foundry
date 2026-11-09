#include <array>
#include <iostream>
#include <optional>

struct Queue {
    std::array<int, 3> data{};
    std::size_t head = 0, count = 0;
    bool push(int value) {
        if (count == data.size())
            return false;
        data[(head + count) % data.size()] = value;
        ++count;
        return true;
    }
    std::optional<int> pop() {
        if (!count)
            return std::nullopt;
        int value = data[head];
        head = (head + 1) % data.size();
        --count;
        return value;
    }
};

int main() {
    Queue queue;
    queue.push(1);
    queue.push(2);
    queue.push(3);
    std::cout << "full=" << !queue.push(4) << " first=" << *queue.pop() << "\n";
    queue.push(4);
    while (auto value = queue.pop())
        std::cout << *value;
    std::cout << "\n";
}
