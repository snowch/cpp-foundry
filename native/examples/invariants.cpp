#include <iostream>
#include <stdexcept>
class Score {
    int value_;
public:
    explicit Score(int value) : value_(value) {
        if (value < 0 || value > 100) throw std::invalid_argument("score 0..100");
    }
    int value() const { return value_; }
};
int main() {
    Score score{90};
    std::cout << score.value() << '\n';
    try { Score invalid{101}; }
    catch (const std::invalid_argument& error) { std::cout << error.what() << '\n'; }
}
