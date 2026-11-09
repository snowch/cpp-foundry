# Lists, stacks, and queues

Keep structural ownership separate from borrowed links.

## Own each linked node exactly once

A singly linked list can represent structural ownership with unique_ptr links. The head owns the first node and each node owns the next. Traversal uses borrowed pointers that never delete nodes.

This small acyclic chain delegates cleanup to the ownership structure. Very long recursive destruction chains may need an iterative teardown strategy.

```cpp
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

```

Expected output:

```text
12
```

Prepending transfers the old head into the new node before publishing the new head. Traversal borrows each node while the list stays alive.

Pitfall: Two owning pointers to the same node would violate unique ownership and could double-delete it.

Question: Who owns the second node?

1. The traversal pointer
2. The first node’s next member
3. Every pointer that reaches it

Answer: 2. The chain has one owning link per node.

Experiment: Add a third node and draw owners separately from observer pointers. Explain why an owning back-link would create a different lifetime problem.

## Detach an owner before destroying a node

Removing a head node requires transferring ownership of its successor before the old head is destroyed. Use a local owner to keep the removed node alive while its next link is detached.

After removal, any observer of the removed node is invalid. An observer of a surviving node remains useful only while its new owner chain stays alive.

```cpp
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
    auto removed = std::move(head);
    head = std::move(removed->next);
    removed.reset();
    std::cout << head->value << "\n";
}

```

Expected output:

```text
2
```

The old head is held in removed. Its successor moves into head before the old node is released.

Pitfall: Do not read a member through a node after replacing and destroying the owner of that node.

Question: Why keep the removed node in a local owner?

1. To detach its successor while the node is still alive
2. To create shared ownership
3. To copy the entire list

Answer: 1. The local establishes the required lifetime during the ownership transfer.

Experiment: Handle an empty list and a single-node list. Return an optional removed value without returning a pointer to the destroyed node.

## A stack exposes last-in, first-out behavior

A stack restricts operations to the most recently added item. This matches nested work such as undo history or an explicit replacement for recursion. The backing container’s broader operations should not leak into a narrow stack contract.

Check emptiness before observing or removing the top item; standard adaptors do not return an optional for an empty pop.

```cpp
#include <iostream>
#include <stack>

int main() {
    std::stack<int> work;
    work.push(1);
    work.push(2);
    work.push(3);
    while (!work.empty()) {
        std::cout << work.top();
        work.pop();
    }
    std::cout << "\n";
}

```

Expected output:

```text
321
```

The most recently pushed value is removed first, producing the reverse insertion order.

Pitfall: Calling top on an empty stack violates its precondition.

Question: Which item is removed first?

1. The last item pushed
2. The first item pushed
3. The smallest item

Answer: 1. LIFO refers to insertion history rather than numeric order.

Experiment: Implement the same interface with a vector and compare the empty-state contract. Use the stack to traverse a small tree iteratively.

## Separate a ring’s logical order from its array positions

A bounded ring queue reuses an array by wrapping physical positions. The logical head and live count determine the next insertion slot. Count distinguishes empty from full even when modular positions coincide.

Reject a full insertion before changing any queue state. This makes the failure behavior easy to test.

```cpp
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

```

Expected output:

```text
full=1 first=1
234
```

After removing one, insertion wraps to the freed slot. The remaining logical order is two, three, four.

Pitfall: Comparing head and tail positions without another state rule can confuse full with empty.

Question: What disambiguates full and empty here?

1. The values stored in unused slots
2. The live count
3. The array address

Answer: 2. Count is zero when empty and capacity when full.

Experiment: Test several complete wrap cycles and a rejected insertion. Compare every popped value with a deque reference model.

## A queue preserves arrival order

A FIFO queue removes the oldest pending item. deque supports efficient insertion at one end and removal at the other without requiring every remaining element to shift.

The container alone does not provide a concurrent shutdown protocol. Later queue lessons add synchronization, close state, and draining rules.

```cpp
#include <deque>
#include <iostream>

int main() {
    std::deque<int> pending{10, 20};
    pending.push_back(30);
    while (!pending.empty()) {
        std::cout << pending.front() << " ";
        pending.pop_front();
    }
    std::cout << "empty=" << pending.empty() << "\n";
}

```

Expected output:

```text
10 20 30 empty=1
```

The output preserves insertion order and the final queue is empty.

Pitfall: A thread-safe allocator does not make unsynchronized deque operations thread-safe.

Question: What additional contract does a concurrent queue need?

1. A different integer type only
2. Synchronization and shutdown behavior
3. A promise that allocation never occurs

Answer: 2. Container ownership and inter-thread coordination are separate responsibilities.

Experiment: Add a bounded capacity rule to a queue wrapper. Specify whether full insertion rejects, blocks, or drops an item.

## Chapter project

Build a queue with explicit empty/full behavior.
