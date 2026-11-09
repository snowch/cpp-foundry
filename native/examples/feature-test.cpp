#include <iostream>
#include <span>
#include <version>

int main() {
    static_assert(__cpp_lib_span>=202002L);
    int values[]{1,2};std::span<int> view(values);
    std::cout<<"span="<<view.size()<<"\n";
}
