# Lists, stacks, and queues

Keep structural ownership separate from borrowed links.

## Own each linked node exactly once

Before this chapter: [Cache results for repeated subproblems](../recursion/README.md)

A node is an object holding a value and links to other nodes. A stack removes the most recently added item first; a queue removes the oldest item first. A ring buffer reuses fixed storage by wrapping positions back to the beginning.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/owned-list.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/owned-list.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
prepend(head, 1);
```

With

```cpp
prepend(head, 1); prepend(head, 3);
```

Rerun the terminal command. Compare the traversal sequences. Where does a new owning head appear in the output?

## Detach an owner before destroying a node

Before this chapter: [Cache results for repeated subproblems](../recursion/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/remove-owned-node.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/remove-owned-node.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
prepend(head, 2);
```

With

```cpp
prepend(head, 3);
```

Rerun the terminal command. Compare the value after removal. Which previous node becomes reachable through head once the old head is destroyed?

## A stack exposes last-in, first-out behavior

Before this chapter: [Cache results for repeated subproblems](../recursion/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/lifo-stack.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lifo-stack.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
work.push(3);
```

With

```cpp
work.push(4);
```

Rerun the terminal command. Compare the first printed element. Which added item does a last-in, first-out stack return first?

## Separate a ring’s logical order from its array positions

Before this chapter: [Cache results for repeated subproblems](../recursion/README.md)

A bounded ring queue reuses an array by wrapping physical positions. The logical head and live count determine the next insertion slot. Count distinguishes empty from full even when modular positions coincide.

Reject a full insertion before changing any queue state. This makes the failure behavior easy to test.

[Open figure: Logical order can wrap across array index zero](../../diagrams/ring-buffer.html)

Where does the successful push(4) store its value?

Where does the successful push(4) store its value? Full: head=0, count=3: index 0 = 1, index 1 = 2, index 2 = 3. The first push(4) is rejected; nothing is overwritten.. After pop returns 1: index 0 = 1, index 1 = 2, index 2 = 3. head=1, count=2; index 0 is no longer a live queue member.. After successful push(4): index 0 = 4, index 1 = 2, index 2 = 3. Logical pop order follows indices 1 → 2 → 0: values 2,3,4.. Three fixed slots remain in the same positions. The explicit count distinguishes full from empty; old bits in a removed slot are not a live element.

Three fixed slots remain in the same positions. The explicit count distinguishes full from empty; old bits in a removed slot are not a live element.

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/ring-buffer.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/ring-buffer.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
queue.push(4);
    while
```

With

```cpp
queue.push(5);
    while
```

Rerun the terminal command. Compare full= and first= with the remaining sequence. Which value fills the space opened by the first pop?

## A queue preserves arrival order

Before this chapter: [Cache results for repeated subproblems](../recursion/README.md)

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

Original program output:

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

### Run the starter, then try a change

Open `native/examples/fifo-deque.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/fifo-deque.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
pending.push_back(30);
```

With

```cpp
pending.push_back(40);
```

Rerun the terminal command. Compare the final printed item and empty=. How does FIFO place the new value after the original two?

## Chapter project

Build a queue with explicit empty/full behavior.
