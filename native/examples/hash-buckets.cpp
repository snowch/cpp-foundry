#include <array>
#include <iostream>
#include <optional>

template <std::size_t N> struct Hash {
    enum class State { empty, full, deleted };
    struct Slot {
        State state = State::empty;
        unsigned key = 0;
        int value = 0;
    };
    std::array<Slot, N> slots{};
    bool put(unsigned key, int value) {
        std::optional<std::size_t> free;
        for (std::size_t step = 0; step < N; ++step) {
            auto at = (key % N + step) % N;
            auto &slot = slots[at];
            if (slot.state == State::full && slot.key == key)
                return false;
            if (slot.state != State::full && !free)
                free = at;
            if (slot.state == State::empty)
                break;
        }
        if (!free)
            return false;
        slots[*free] = {State::full, key, value};
        return true;
    }
    std::optional<int> get(unsigned key) const {
        for (std::size_t step = 0; step < N; ++step) {
            const auto &slot = slots[(key % N + step) % N];
            if (slot.state == State::empty)
                return std::nullopt;
            if (slot.state == State::full && slot.key == key)
                return slot.value;
        }
        return std::nullopt;
    }
    bool erase(unsigned key) {
        for (std::size_t step = 0; step < N; ++step) {
            auto &slot = slots[(key % N + step) % N];
            if (slot.state == State::empty)
                return false;
            if (slot.state == State::full && slot.key == key) {
                slot.state = State::deleted;
                return true;
            }
        }
        return false;
    }
};

int main() {
    Hash<7> table;
    table.put(1, 10);
    table.put(8, 80);
    std::cout << "bucket=" << 1 % 7 << "," << 8 % 7 << " values=" << *table.get(1)
              << "," << *table.get(8) << "\n";
}
