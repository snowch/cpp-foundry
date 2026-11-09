#include <array>
#include <iostream>
#include <string_view>

struct Check {
    std::string_view name;
    bool required;
    bool passed;
};

int main() {
    const std::array<Check, 3> checks{{{"exact bytes", true, true},
                                       {"rejected import", true, true},
                                       {"power loss", false, false}}};
    unsigned required_missing = 0;
    for (const auto &check : checks) {
        if (check.required && !check.passed)
            ++required_missing;
        std::cout << check.name << ":" << (check.passed ? "checked" : "not qualified")
                  << "\n";
    }
    return required_missing ? 1 : 0;
}
