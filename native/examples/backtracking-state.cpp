#include <iostream>
#include <vector>

void subsets(int next, int limit, std::vector<int> &path) {
    if (next > limit) {
        for (int value : path)
            std::cout << value;
        std::cout << ".\n";
        return;
    }
    subsets(next + 1, limit, path);
    path.push_back(next);
    subsets(next + 1, limit, path);
    path.pop_back();
}

int main() {
    std::vector<int> path;
    subsets(1, 2, path);
}
