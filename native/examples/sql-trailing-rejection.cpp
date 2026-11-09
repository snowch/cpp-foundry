#include <charconv>
#include <iostream>
#include <optional>
#include <stdexcept>
#include <string>
#include <string_view>
#include <system_error>
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
struct Select {
    std::optional<unsigned> id;
};
Select parse(std::string_view input) {
    auto tokens = lex(input);
    std::size_t at = 0;
    auto take = [&](std::string_view wanted) {
        if (at >= tokens.size() || tokens[at].quoted || tokens[at].text != wanted)
            throw std::runtime_error("syntax error");
        ++at;
    };
    take("SELECT");
    take("*");
    take("FROM");
    take("people");
    Select query;
    if (at < tokens.size() && tokens[at].text == "WHERE") {
        take("WHERE");
        take("id");
        take("=");
        if (at >= tokens.size() || tokens[at].quoted)
            throw std::runtime_error("expected ID");
        const auto &text = tokens[at++].text;
        unsigned id = 0;
        auto [end, error] = std::from_chars(text.data(), text.data() + text.size(), id);
        if (error != std::errc{} || end != text.data() + text.size() || !id)
            throw std::runtime_error("invalid ID");
        query.id = id;
    }
    take(";");
    if (at != tokens.size())
        throw std::runtime_error("trailing tokens");
    return query;
}

int main() {
    for (auto text : {"SELECT * FROM people;", "SELECT * FROM people; SAVE"}) {
        try {
            parse(text);
            std::cout << "accepted\n";
        } catch (const std::exception &error) {
            std::cout << error.what() << "\n";
        }
    }
}
