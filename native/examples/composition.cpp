#include <iostream>

struct ScorePolicy {
    unsigned maximum;
    bool accepts(unsigned score) const {
        return score <= maximum;
    }
};
struct Store {
    ScorePolicy policy;
    bool accepts(unsigned score) const {
        return policy.accepts(score);
    }
};

int main() {
    Store store{ScorePolicy{100}};
    std::cout << store.accepts(90) << " " << store.accepts(101) << "\n";
}
