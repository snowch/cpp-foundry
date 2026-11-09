# Sorting and algorithm strategies

Compare stable sorting, partitioning, merging, and selection.

## Insertion sort maintains a sorted prefix

Insertion sort takes the next element and moves it into an already sorted prefix. Its invariant is that elements before the current index are ordered and contain exactly the earlier input values.

The worst-case number of shifts is quadratic, but nearly sorted small inputs can require little movement. A correct implementation keeps the temporarily removed key in an owning local value.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{4, 1, 3, 2};
    unsigned shifts = 0;
    for (std::size_t i = 1; i < values.size(); ++i) {
        int key = values[i];
        auto j = i;
        while (j > 0 && key < values[j - 1]) {
            values[j] = values[j - 1];
            --j;
            ++shifts;
        }
        values[j] = key;
    }
    for (int value : values)
        std::cout << value;
    std::cout << " shifts=" << shifts << "\n";
}

```

Expected output:

```text
1234 shifts=4
```

The key is preserved while larger prefix values shift right. Four shifts are needed for this particular input.

Pitfall: Using an unsigned index without testing j>0 before reading j-1 can underflow the index.

Question: What is sorted before iteration i?

1. The prefix [0,i)
2. The entire suffix
3. Only the final two elements

Answer: 1. Each iteration extends the sorted prefix by one element.

Experiment: Count shifts for sorted and reversed inputs of the same size. Verify duplicate values are neither lost nor invented.

## Merge two sorted ranges

Merging repeatedly selects the smaller next element from two sorted inputs. The result remains ordered because each remaining input suffix is ordered. This operation is the linear-work step used by merge sort.

The destination owns the output values. Its capacity or insertion interface must support the complete combined length.

```cpp
#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
    std::vector<int> left{1, 4, 8}, right{2, 4, 9}, result;
    std::merge(left.begin(), left.end(), right.begin(), right.end(),
               std::back_inserter(result));
    for (int value : result)
        std::cout << value;
    std::cout << "\n";
}

```

Expected output:

```text
124489
```

Both copies of 4 are retained. The merge consumes each input once and appends six output elements.

Pitfall: Merging unsorted inputs does not repair their ordering automatically.

Question: What does merge require of each input?

1. It has unique values
2. It is already sorted under the same ordering
3. It has the same length as the other input

Answer: 2. The correctness argument relies on ordered remaining suffixes.

Experiment: Test an empty side and equal values on both sides. Label equal records to investigate merge’s stability rule.

## Preserve equivalent-record order when the contract needs it

A stable sort preserves the input order among elements equivalent under its comparator. This matters when a previous ordering or arrival sequence is part of the observable result.

Stability is distinct from defining a tie-breaker. A total tie-breaker specifies a new ordering; stability retains the earlier ordering of equivalent elements.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Row {
    int key;
    std::string label;
};

int main() {
    std::vector<Row> rows{{2, "A"}, {1, "B"}, {2, "C"}};
    std::stable_sort(rows.begin(), rows.end(),
                     [](const Row &a, const Row &b) { return a.key < b.key; });
    for (const auto &row : rows)
        std::cout << row.label;
    std::cout << "\n";
}

```

Expected output:

```text
BAC
```

B moves before the key-2 group. A remains before C because their keys are equivalent.

Pitfall: std::sort is not required to preserve the order of equivalent records.

Question: Why does A remain before C?

1. All sorts compare labels automatically
2. The labels are pointers
3. The sort is stable and their keys are equivalent

Answer: 3. Stability preserves their input-relative order.

Experiment: Reverse the two key-2 records before sorting and compare. Then replace stability with an explicit label tie-breaker and explain the difference.

## Select a rank without fully sorting

nth_element partitions a range so that the chosen position contains an element of its sorted rank. Elements before it are not greater than elements after it under the ordering, but each side is not necessarily sorted.

This supports median and top-k operations when a complete order would do unnecessary work. Sort only the selected prefix if its displayed order is part of the output contract.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> values{9, 1, 7, 3, 5};
    auto middle = values.begin() + 2;
    std::nth_element(values.begin(), middle, values.end());
    std::cout << "median=" << *middle << "\n";
}

```

Expected output:

```text
median=5
```

Position two has the median of five values. The program intentionally does not print unspecified internal ordering of the partitions.

Pitfall: Printing the whole range as though nth_element sorted it makes an unsupported assumption.

Question: Are both partitions fully sorted?

1. Yes
2. Only when all values are distinct
3. No

Answer: 3. The operation establishes a rank partition, not complete sorting.

Experiment: Select the three smallest values, sort that prefix for display, and compare it with an independently sorted copy.

## Check ordering and permutation preservation independently

A sort must produce an ordered sequence and preserve the input multiset. Checking only orderedness would accept a result that discarded every element. An independent reference result can expose both kinds of failure.

Use adversarial fixtures with duplicates and negative values, then broaden the workload without replacing the contract with the implementation’s own logic.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    const std::vector<int> input{3, -1, 3, 0};
    auto result = input;
    std::ranges::sort(result);
    const std::vector<int> expected{-1, 0, 3, 3};
    bool correct = std::ranges::is_sorted(result) && result == expected;
    std::cout << "verified=" << correct << "\n";
    return correct ? 0 : 1;
}

```

Expected output:

```text
verified=1
```

The expected sequence specifies all four values and duplicate multiplicity, rather than just a monotonicity property.

Pitfall: A test oracle that calls the same buggy custom sort can agree with it for the wrong reason.

Question: Would an empty output satisfy is_sorted?

1. Yes, so size and content also matter
2. No
3. Only for empty input

Answer: 1. Orderedness alone does not establish permutation preservation.

Experiment: Check empty, single, all-equal, already sorted, and reversed fixtures. Compare a custom implementation with the standard algorithm.

## Chapter project

Check sort properties against an independent reference.
