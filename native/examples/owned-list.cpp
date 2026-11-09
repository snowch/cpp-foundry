#include <iostream>
#include <memory>
#include <utility>

struct Node {
    int value;
    std::unique_ptr<Node> next;
};
void prepend(std::unique_ptr<Node> &head, int value) {
    auto node = std::make_unique<Node>(Node{value, nullptr});
    node->next = std::move(head);
    head = std::move(node);
}

int main() {
    std::unique_ptr<Node> head;
    prepend(head, 2);
    prepend(head, 1);
    for (const Node *node = head.get(); node; node = node->next.get())
        std::cout << node->value;
    std::cout << "\n";
}
