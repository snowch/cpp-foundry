#include <iostream>
#include <memory>
#include <type_traits>
#include <utility>

struct Page {
    std::unique_ptr<int> value;
};

int main() {
    static_assert(!std::is_copy_constructible_v<Page>);
    static_assert(std::is_move_constructible_v<Page>);
    Page first{std::make_unique<int>(12)};
    Page second=std::move(first);
    std::cout << !first.value << " " << *second.value << "\n";
}
