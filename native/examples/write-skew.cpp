#include <iostream>

int main() {
    bool alice = true, bob = true;
    bool first_saw_bob = bob, second_saw_alice = alice;
    if (first_saw_bob)
        alice = false;
    if (second_saw_alice)
        bob = false;
    std::cout << "on_call=" << (alice || bob) << "\n";
}
