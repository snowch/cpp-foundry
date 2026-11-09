#include <iostream>
#include <string>

struct Message {
    std::string text;
};
Message make_message() {
    return Message{"ready"};
}

int main() {
    Message result = make_message();
    std::cout << result.text << "\n";
}
