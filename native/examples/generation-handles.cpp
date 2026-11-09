#include <iostream>

struct Handle {
    unsigned slot, generation;
};
struct Slot {
    unsigned generation;
    int value;
    bool live;
};

int main() {
    Slot slot{1, 10, true};
    Handle old{0, 1};
    slot.live = false;
    ++slot.generation;
    slot.value = 20;
    slot.live = true;
    bool valid = old.slot == 0 && slot.live && old.generation == slot.generation;
    std::cout << "stale_rejected=" << !valid << " current=" << slot.value << "\n";
}
