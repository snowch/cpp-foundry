#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
    std::vector<int> input{1, 2, 3}, output;
    std::transform(input.begin(), input.end(), std::back_inserter(output),
                   [](int value) { return value * value; });
    for (int value : output)
        std::cout << value << " ";
    std::cout << "size=" << output.size() << "\n";
}
