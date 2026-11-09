# A bounded B+ tree

Implement leaf routing, splitting, borrowing, merging, and invariant checks.

## Route a key through leaf separator values

A B+ index keeps payload keys in leaves and uses separator values to choose a leaf. This bounded model has one routing root and at most eight four-key leaves; separators are derived from each right leaf’s first key.

It is not an arbitrary-height serialized B+ tree. Value-owned leaf vectors make structural ownership explicit while the lessons focus on routing and occupancy.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    for (int key : {1, 2, 3, 4, 5})
        tree.insert(key);
    std::cout << "leaves=" << tree.leaves.size() << " route2=" << tree.route(2)
              << " route3=" << tree.route(3) << "\n";
}

```

Expected output:

```text
leaves=2 route2=0 route3=1
```

After the first split, key three is the right leaf’s separator. Equal keys route right to the leaf that actually stores them.

Pitfall: A separator equality rule inconsistent with insertion can make stored keys unreachable.

Question: Where does a key equal to the right leaf’s separator route?

1. To that right leaf
2. Always to the left leaf
3. To no leaf

Answer: 1. The separator is the minimum key of the right leaf in this model.

Experiment: Check keys below all entries, exactly at separators, between keys, and above all entries after several splits.

## Split an overflowing leaf before publishing structure

A leaf split redistributes an overflowing sorted key sequence into two leaves and adds a routing boundary. Here five keys split into two on the left and three on the right.

Insertion prepares a complete candidate leaf collection before swapping it into the live index. Allocation failure during preparation therefore does not partially publish the new routing structure.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    for (int key : {1, 2, 3, 4, 5})
        tree.insert(key);
    std::cout << tree.leaves[0].size() << " " << tree.leaves[1].size()
              << " valid=" << tree.valid() << "\n";
}

```

Expected output:

```text
2 3 valid=1
```

Both resulting leaves fit the four-key maximum and the two-key non-root minimum.

Pitfall: Updating a separator before installing its new leaf can expose an inconsistent index.

Question: What is prepared before the live swap?

1. Only the printed separator
2. A raw pointer to a temporary leaf
3. The complete candidate leaf collection

Answer: 3. Fallible structural preparation is separate from publication.

Experiment: Insert at the beginning, middle, and end of a full leaf. Verify the complete key sequence and occupancy after each split.

## A range query crosses leaf boundaries

A B+ range query starts at the appropriate lower boundary and continues through ordered leaves until the exclusive upper boundary. This model stores leaf order in the owning vector rather than a serialized sibling chain.

The query contract uses [low,high), which makes adjacent ranges composable without returning a boundary key twice.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    for (int key = 1; key <= 9; ++key)
        tree.insert(key);
    for (int key : tree.range(3, 8))
        std::cout << key;
    std::cout << "\n";
}

```

Expected output:

```text
34567
```

The query returns keys three through seven across several leaves, excluding eight.

Pitfall: Stopping at the first leaf boundary loses valid matches in later leaves.

Question: Is the upper key eight included?

1. Yes
2. No
3. Only if it is a separator

Answer: 2. The result contract is a half-open key interval.

Experiment: Test an empty range, a missing lower key, and boundaries exactly on separators. Compare with a std::set range.

## Reject duplicates and bounded-root exhaustion without mutation

An index needs explicit failure behavior for duplicate keys and for its supported structural capacity. This model rejects an insertion that would require a ninth root child. Its maximum usable key count depends on leaf occupancy, not just four times the number of leaves.

Both rejection checks occur before copying or mutating live leaves.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    for (int key = 1; key <= 18; ++key)
        tree.insert(key);
    auto before = tree.leaves;
    bool duplicate = !tree.insert(1), bounded = !tree.insert(19);
    std::cout << "duplicate=" << duplicate << " bounded=" << bounded
              << " preserved=" << (before == tree.leaves) << "\n";
}

```

Expected output:

```text
duplicate=1 bounded=1 preserved=1
```

Sequential insertion has already produced eight leaves. Splitting the final full leaf would exceed the root contract, so the saved representation remains unchanged.

Pitfall: Calling a bounded two-level model a production arbitrary-height tree conceals a critical capacity limit.

Question: What must rejection preserve?

1. Only the root address
2. The existing keys and routing state
3. Nothing if a message is printed

Answer: 2. An unsuccessful operation must retain the promised valid index state.

Experiment: Try different insertion orders and record where the root limit is reached. Verify every earlier key remains searchable after rejection.

## Borrow from a sibling with spare occupancy

Deletion can leave a non-root leaf below its minimum occupancy. If an adjacent sibling has more than the minimum, a boundary key can move across while retaining global ordering. The routing separator must reflect the new boundary.

Derived separators in this model update automatically from the current leaf contents.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    for (int key = 1; key <= 5; ++key)
        tree.insert(key);
    tree.erase(1);
    std::cout << "left=" << tree.leaves[0].front() << "," << tree.leaves[0].back()
              << " right=" << tree.leaves[1].front() << " valid=" << tree.valid()
              << "\n";
}

```

Expected output:

```text
left=2,3 right=4 valid=1
```

The right sibling gives key three to the underfull left leaf. Its new first key becomes four.

Pitfall: Borrowing from a minimum-sized sibling simply transfers the occupancy violation.

Question: When can a sibling donate?

1. Whenever it exists
2. Only when it is empty
3. When it has more than the minimum occupancy

Answer: 3. Donation must leave both leaves valid.

Experiment: Construct the mirrored left-sibling donation case and validate separator-equality searches after the borrow.

## Merge when neither sibling can donate

If an underfull leaf and its sibling fit together but the sibling cannot donate, merging removes a child from the routing root. Ownership of all surviving keys must transfer before the removed leaf representation disappears.

This bounded model merges value vectors in a candidate state, then publishes the complete result.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    for (int key = 1; key <= 5; ++key)
        tree.insert(key);
    tree.erase(5);
    tree.erase(1);
    std::cout << "leaves=" << tree.leaves.size() << " keys=";
    for (int key : tree.range(0, 10))
        std::cout << key;
    std::cout << " valid=" << tree.valid() << "\n";
}

```

Expected output:

```text
leaves=1 keys=234 valid=1
```

After the first deletion both leaves are at minimum occupancy. The second deletion forces a merge into one three-key leaf.

Pitfall: Removing a root child without preserving all survivor keys can pass a simple occupancy check while losing data.

Question: Why merge instead of borrowing in this fixture?

1. The deleted key was odd
2. The sibling has no spare key
3. Merging is required after every deletion

Answer: 2. A minimum-sized sibling cannot donate without becoming invalid.

Experiment: Compare the full pre/post key sets against an independent set after every borrow and merge sequence.

## Give the root an explicit empty-tree representation

Root occupancy rules differ from non-root leaf rules. A tree with no keys still needs a valid representation that supports future insertion and missing lookup. This model keeps one empty leaf under the bounded routing representation.

Deletion of a missing key reports failure without changing the existing structure.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    tree.insert(7);
    tree.erase(7);
    std::cout << "leaves=" << tree.leaves.size() << " empty=" << tree.leaves[0].empty()
              << " missing=" << !tree.erase(7) << " valid=" << tree.valid() << "\n";
}

```

Expected output:

```text
leaves=1 empty=1 missing=1 valid=1
```

Deleting the only key returns to the documented empty representation. The second deletion is a preserved-state failure.

Pitfall: Applying a non-root minimum occupancy rule to the empty root can make a valid empty tree impossible.

Question: Is the single empty root leaf valid here?

1. No
2. Yes
3. Only until another lookup happens

Answer: 2. The root has an explicitly different occupancy rule.

Experiment: Alternate deleting the final key and reinserting a new key. Check empty lookup and range-query behavior each time.

## Check mixed updates against independent membership and structure

A reference ordered set supplies expected key membership and sorted traversal. Independent index checks supply occupancy, routing order, and root limits. Compare after every mutation so a short failing prefix identifies the first broken transition.

This finite workload verifies the bounded implementation on its fixtures; it is not a proof of arbitrary-height or disk recovery behavior.

```cpp
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <optional>
#include <set>
#include <utility>
#include <vector>

struct Index {
    std::vector<std::vector<int>> leaves{{}};
    std::size_t route(int key) const {
        std::size_t at = 0;
        while (at + 1 < leaves.size() && key >= leaves[at + 1].front())
            ++at;
        return at;
    }
    bool contains(int key) const {
        const auto &leaf = leaves[route(key)];
        return std::binary_search(leaf.begin(), leaf.end(), key);
    }
    bool insert(int key) {
        auto at = route(key);
        if (contains(key))
            return false;
        if (leaves[at].size() == 4 && leaves.size() == 8)
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.insert(std::lower_bound(leaf.begin(), leaf.end(), key), key);
        if (leaf.size() > 4) {
            std::vector<int> right(leaf.begin() + 2, leaf.end());
            leaf.erase(leaf.begin() + 2, leaf.end());
            candidate.insert(candidate.begin() + static_cast<std::ptrdiff_t>(at + 1),
                             std::move(right));
        }
        leaves.swap(candidate);
        return true;
    }
    bool erase(int key) {
        auto at = route(key);
        if (!contains(key))
            return false;
        auto candidate = leaves;
        auto &leaf = candidate[at];
        leaf.erase(std::lower_bound(leaf.begin(), leaf.end(), key));
        if (leaf.size() < 2 && candidate.size() > 1) {
            if (at > 0 && candidate[at - 1].size() > 2) {
                leaf.insert(leaf.begin(), candidate[at - 1].back());
                candidate[at - 1].pop_back();
            } else if (at + 1 < candidate.size() && candidate[at + 1].size() > 2) {
                leaf.push_back(candidate[at + 1].front());
                candidate[at + 1].erase(candidate[at + 1].begin());
            } else if (at > 0) {
                auto &left = candidate[at - 1];
                left.insert(left.end(), leaf.begin(), leaf.end());
                candidate.erase(candidate.begin() + static_cast<std::ptrdiff_t>(at));
            } else {
                leaf.insert(leaf.end(), candidate[1].begin(), candidate[1].end());
                candidate.erase(candidate.begin() + 1);
            }
        }
        leaves.swap(candidate);
        return true;
    }
    std::vector<int> range(int low, int high) const {
        std::vector<int> result;
        for (const auto &leaf : leaves)
            for (int key : leaf)
                if (key >= low && key < high)
                    result.push_back(key);
        return result;
    }
    bool valid() const {
        if (leaves.empty() || leaves.size() > 8)
            return false;
        std::optional<int> previous;
        for (const auto &leaf : leaves) {
            if (leaf.size() > 4 || (leaves.size() > 1 && leaf.size() < 2))
                return false;
            for (int key : leaf) {
                if (previous && *previous >= key)
                    return false;
                previous = key;
            }
        }
        return true;
    }
};

int main() {
    Index tree;
    std::set<int> model;
    bool valid = true;
    for (int key : {8, 1, 6, 2, 7, 3, 5, 4}) {
        tree.insert(key);
        model.insert(key);
        valid = valid && tree.valid();
    }
    for (int key : {1, 6, 8, 3}) {
        tree.erase(key);
        model.erase(key);
        valid = valid && tree.valid();
    }
    auto actual = tree.range(-100, 100);
    std::vector<int> expected(model.begin(), model.end());
    valid = valid && actual == expected;
    std::cout << "reference=" << valid << "\n";
    return valid ? 0 : 1;
}

```

Expected output:

```text
reference=1
```

The independent set and bounded tree agree on all remaining keys while structural checks hold after each operation.

Pitfall: A traversal-only oracle may miss invalid occupancy that causes the next mutation to fail.

Question: Which properties are checked separately?

1. Only serialized byte size
2. Only the newest inserted key
3. Logical contents and structural invariants

Answer: 3. Representation validity and observable results are complementary checks.

Experiment: Enumerate short insertion/deletion sequences and retain the smallest failing prefix. Add boundary and root-exhaustion cases separately.

## Chapter project

Extend the bounded root/leaf index while retaining a reference-model oracle.
