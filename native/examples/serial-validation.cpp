#include <iostream>

int main() {
    unsigned revision = 0, first_base = revision, second_base = revision;
    bool alice = true, bob = true;
    if (first_base == revision) {
        alice = false;
        ++revision;
    }
    bool second_ok = second_base == revision;
    if (second_ok) {
        bob = false;
        ++revision;
    }
    std::cout << "second=" << second_ok << " invariant=" << (alice || bob) << "\n";
}
