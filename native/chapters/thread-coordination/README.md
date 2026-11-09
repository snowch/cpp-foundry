# Threads, queues, and shutdown

Coordinate ownership transfer and deterministic shutdown.

## Join before borrowed worker state is destroyed

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

Expected output:

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

Experiment: Move the worker into an inner scope and rely on jthread destruction. Explain the required declaration and destruction order.

## Acquire several mutexes with a consistent protocol

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

Expected output:

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

Experiment: Add a concurrent observer using the same lock set. Check the conserved total without reading either balance outside the protocol.

## Wait for a predicate, not just a notification

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

Expected output:

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

Experiment: Add two consumers and aggregate results without racing. Check every produced value is consumed exactly once.

## Define whether close drains or discards pending work

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

Expected output:

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

Experiment: Test close on an empty queue and close while a producer is waiting for space. Ensure all participants can finish.

## A stop request is a cooperative signal

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

Expected output:

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

Experiment: Add a stop_callback that wakes a waiting protocol, or use a supported stop-aware wait. Test cleanup after a stop request.

## Chapter project

Build a draining producer/consumer queue with a close contract.
