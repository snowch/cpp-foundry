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
