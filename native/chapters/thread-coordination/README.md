# Threads, queues, and shutdown

Coordinate ownership transfer and deterministic shutdown.

## Join before borrowed worker state is destroyed

Before this chapter: [Protect a shared invariant with a lock](../engineering/README.md)

Joining a thread waits for it to finish before execution proceeds. Shutdown describes how work stops: it may drain already accepted work or abandon it according to an explicit rule. A stop request is a request the worker checks, not forced interruption.

A worker capturing local references borrows objects owned by its caller. The caller must keep those objects alive until the worker finishes. jthread supplies RAII joining, and an explicit join can establish completion before a result is observed.

Destruction order matters: declare borrowed state before the thread owner so reverse destruction releases the thread first.

```cpp
#include <iostream>
#include <thread>

int main() {
    int result = 0;
    std::jthread worker([&] { result = 42; });
    worker.join();
    std::cout << "joined=" << result << "\n";
}

```

Original program output:

```text
joined=42
```

Joining establishes worker completion before main reads the result. The result’s lifetime covers the worker access.

Pitfall: Detaching a thread does not extend the lifetime of captured references.

Question: What makes the result read synchronized?

1. The integer being small
2. The successful join
3. The lambda syntax

Answer: 2. Thread completion synchronizes with the completed join.

### Run the starter, then try a change

Open `native/examples/joined-lifetime.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/joined-lifetime.cpp -pthread -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::jthread worker([&] { result = 42; });
    worker.join();
```

With

```cpp
{ std::jthread worker([&] { result = 42; }); }
```

Rerun the terminal command. Compare joined=. Which closing brace destroys the jthread and waits before the result is printed?

## Acquire several mutexes with a consistent protocol

Before this chapter: [Protect a shared invariant with a lock](../engineering/README.md)

A compound operation can need locks for two resources. Opposite manual acquisition orders can deadlock. scoped_lock can acquire several mutexes with deadlock-avoidance behavior and release them with RAII.

Every conflicting access must follow a compatible locking protocol; locking only the transfer writer does not protect an unlocked reader.

```cpp
#include <iostream>
#include <mutex>
#include <thread>

int main() {
    int a = 10, b = 20;
    std::mutex first, second;
    auto transfer = [&] {
        std::scoped_lock lock(first, second);
        --a;
        ++b;
    };
    std::jthread one(transfer), two(transfer);
    one.join();
    two.join();
    std::cout << a << " " << b << " total=" << a + b << "\n";
}

```

Original program output:

```text
8 22 total=30
```

Both transfers hold the two locks while preserving the combined balance. Joining precedes the final unlocked observation.

Pitfall: A lock-order convention is ineffective if a helper silently acquires the same resources in the opposite order.

Question: Which state must be protected as one unit?

1. Only the output stream
2. Only the destination balance
3. Both balances during the transfer

Answer: 3. The invariant spans both shared values.

### Run the starter, then try a change

Open `native/examples/multi-lock.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/multi-lock.cpp -pthread -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
--a;
        ++b;
```

With

```cpp
a -= 2;
        b += 2;
```

Rerun the terminal command. Compare the final balances and total=. What remains unchanged when both workers move two units under the same locks?

## Wait for a predicate, not just a notification

Before this chapter: [Protect a shared invariant with a lock](../engineering/README.md)

New terms and notation:

A condition variable lets a thread wait until shared state may satisfy a condition. The waiting code checks that condition while following its mutex rule; a notification is a prompt to check again, not a stored guarantee that the condition is true.

A spurious wakeup is a wait returning even though no notification establishing the desired condition occurred. Check the protected condition again after waking; the predicate form of wait performs that repeated check.

Condition-variable notifications are not stored permits and waits can wake spuriously. A waiter must check a shared predicate while holding the mutex. The predicate also needs a shutdown alternative so an empty closed queue can stop waiting.

This bounded queue has capacity two and transfers integer values by ownership into a deque.

```cpp
#include <condition_variable>
#include <deque>
#include <iostream>
#include <mutex>
#include <optional>
#include <thread>

class Queue {
    std::mutex mutex_;
    std::condition_variable changed_;
    std::deque<int> values_;
    bool closed_ = false;

  public:
    bool push(int value) {
        std::unique_lock lock(mutex_);
        changed_.wait(lock, [&] { return closed_ || values_.size() < 2; });
        if (closed_)
            return false;
        values_.push_back(value);
        lock.unlock();
        changed_.notify_all();
        return true;
    }
    std::optional<int> pop() {
        std::unique_lock lock(mutex_);
        changed_.wait(lock, [&] { return closed_ || !values_.empty(); });
        if (values_.empty())
            return std::nullopt;
        int value = values_.front();
        values_.pop_front();
        lock.unlock();
        changed_.notify_all();
        return value;
    }
    void close() {
        std::lock_guard lock(mutex_);
        closed_ = true;
        changed_.notify_all();
    }
};

int main() {
    Queue queue;
    int sum = 0;
    std::jthread consumer([&] {
        while (auto value = queue.pop())
            sum += *value;
    });
    for (int value : {1, 2, 3, 4, 5})
        queue.push(value);
    queue.close();
    consumer.join();
    std::cout << "sum=" << sum << "\n";
}

```

Original program output:

```text
sum=15
```

The producer may wait for capacity while the consumer may wait for data. Both waits recheck their predicates under the same mutex.

Pitfall: Waiting once without a predicate can consume absent data after a spurious wakeup.

Question: What makes a consumer wait finish?

1. Any unrelated notification alone
2. Data is available or the queue is closed
3. A fixed sleep duration

Answer: 2. The mutex-protected predicate defines readiness.

### Run the starter, then try a change

Open `native/examples/condition-queue.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/condition-queue.cpp -pthread -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
{1, 2, 3, 4, 5}
```

With

```cpp
{1, 2, 3, 4, 6}
```

Rerun the terminal command. Compare sum=. What allows the consumer to process queued values and then finish after close?

## Define whether close drains or discards pending work

Before this chapter: [Protect a shared invariant with a lock](../engineering/README.md)

Queue shutdown is part of the observable API. This queue rejects pushes after close but lets consumers drain already accepted values. Only closed-and-empty returns no next item.

A different cancellation policy might discard pending work, but it needs a different explicit contract and ownership rule for abandoned items.

```cpp
#include <condition_variable>
#include <deque>
#include <iostream>
#include <mutex>
#include <optional>
#include <thread>

class Queue {
    std::mutex mutex_;
    std::condition_variable changed_;
    std::deque<int> values_;
    bool closed_ = false;

  public:
    bool push(int value) {
        std::unique_lock lock(mutex_);
        changed_.wait(lock, [&] { return closed_ || values_.size() < 2; });
        if (closed_)
            return false;
        values_.push_back(value);
        lock.unlock();
        changed_.notify_all();
        return true;
    }
    std::optional<int> pop() {
        std::unique_lock lock(mutex_);
        changed_.wait(lock, [&] { return closed_ || !values_.empty(); });
        if (values_.empty())
            return std::nullopt;
        int value = values_.front();
        values_.pop_front();
        lock.unlock();
        changed_.notify_all();
        return value;
    }
    void close() {
        std::lock_guard lock(mutex_);
        closed_ = true;
        changed_.notify_all();
    }
};

int main() {
    Queue queue;
    queue.push(7);
    queue.push(8);
    queue.close();
    std::cout << "rejected=" << !queue.push(9) << " values=";
    while (auto value = queue.pop())
        std::cout << *value;
    std::cout << " done\n";
}

```

Original program output:

```text
rejected=1 values=78 done
```

The two accepted values remain available in FIFO order after close, and the new push is rejected.

Pitfall: A shutdown flag that wakes consumers but not blocked producers can leave a thread waiting forever.

Question: When does pop return no value?

1. As soon as close is called even with pending work
2. When the queue is closed and empty
3. Whenever a notification is lost

Answer: 2. The draining policy retains accepted work until consumed.

### Run the starter, then try a change

Open `native/examples/draining-close.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/draining-close.cpp -pthread -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
queue.push(8);
```

With

```cpp
queue.push(6);
```

Rerun the terminal command. Compare rejected= and values=. Which accepted items are drained even though later pushes are refused?

## A stop request is a cooperative signal

Before this chapter: [Protect a shared invariant with a lock](../engineering/README.md)

A stop token communicates a request; it does not forcibly terminate a thread or release its resources. A worker must observe the token and return through its normal ownership and cleanup paths.

Blocking operations need a corresponding stop-aware wakeup strategy. Merely setting a token does not make an ordinary condition-variable wait complete.

```cpp
#include <atomic>
#include <iostream>
#include <stop_token>
#include <thread>

int main() {
    std::atomic<bool> observed{false};
    std::jthread worker([&](std::stop_token token) {
        while (!token.stop_requested())
            std::this_thread::yield();
        observed.store(true);
    });
    worker.request_stop();
    worker.join();
    std::cout << "observed=" << observed.load() << "\n";
}

```

Original program output:

```text
observed=1
```

The worker eventually observes the request and exits before join completes. The example does not print schedule-dependent spin counts.

Pitfall: A worker blocked forever in an unrelated operation may never reach its token check.

Question: Does request_stop kill the worker immediately?

1. Yes
2. No, the worker cooperates
3. Only if the worker owns a mutex

Answer: 2. The token is a signal, not forced termination.

### Run the starter, then try a change

Open `native/examples/cooperative-stop.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/cooperative-stop.cpp -pthread -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
worker.request_stop();
```

With

```cpp
std::cout << "requested=" << worker.request_stop() << " ";
```

Rerun the terminal command. Compare requested= with observed=. Which result reports the caller setting the request and which comes from the worker after it sees the request?

## Chapter project

Build a draining producer/consumer queue with a close contract.
