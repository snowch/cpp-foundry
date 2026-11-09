#include <iostream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

struct Token {
    std::string text;
    bool quoted = false;
};
std::vector<Token> lex(std::string_view input) {
    std::vector<Token> result;
    std::size_t at = 0;
    while (at < input.size()) {
        char c = input[at];
        if (c == ' ' || c == '\t' || c == '\n') {
            ++at;
            continue;
        }
        if (c == '\'') {
            ++at;
            std::string text;
            bool closed = false;
            while (at < input.size()) {
                char next = input[at++];
                if (next == '\'') {
                    if (at < input.size() && input[at] == '\'') {
                        text += next;
                        ++at;
                    } else {
                        closed = true;
                        break;
                    }
                } else
                    text += next;
            }
            if (!closed)
                throw std::runtime_error("unterminated string");
            result.push_back({text, true});
            continue;
        }
        if (c == '*' || c == '=' || c == ';') {
            result.push_back({std::string(1, c), false});
            ++at;
            continue;
        }
        std::size_t start = at;
        while (at < input.size() &&
               ((input[at] >= 'A' && input[at] <= 'Z') ||
                (input[at] >= 'a' && input[at] <= 'z') ||
                (input[at] >= '0' && input[at] <= '9') || input[at] == '_'))
            ++at;
        if (at == start)
            throw std::runtime_error("invalid character");
        result.push_back({std::string(input.substr(start, at - start)), false});
    }
    return result;
}

int main() {
    auto tokens = lex("INSERT 'Ada Lovelace' 'O''Brien'");
    for (const auto &token : tokens)
        if (token.quoted)
            std::cout << token.text << "\n";
}
