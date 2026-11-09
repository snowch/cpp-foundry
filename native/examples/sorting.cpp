#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
struct Person { int id; std::string name; };
int main() {
    std::vector<Person> people{{3,"Grace"},{1,"Ada"},{2,"Linus"}};
    std::ranges::sort(people, {}, &Person::id);
    for (const auto& person : people)
        std::cout << person.id << ' ' << person.name << '\n';
    bool found = std::ranges::binary_search(people, 2, {}, &Person::id);
    std::cout << "found=" << found << '\n';
}
