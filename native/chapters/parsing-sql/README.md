# Lexing and a SQL subset

Separate tokens, syntax, and validation before execution.

## Tokenize before assigning syntax

A lexer groups characters into tokens before the parser interprets their relationships. Whitespace separates tokens but is not itself a command. Punctuation such as an equals sign must remain visible even when no spaces surround it.

This chapter implements a deliberately case-sensitive teaching subset. It does not pretend to accept arbitrary SQL or silently split several statements into one.

```cpp
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
    for (const auto &token : lex("SELECT * FROM people WHERE id=7;"))
        std::cout << "[" << token.text << "]";
    std::cout << "\n";
}

```

Expected output:

```text
[SELECT][*][FROM][people][WHERE][id][=][7][;]
```

The ID comparison becomes three tokens even though id=7 has no internal whitespace.

Pitfall: Splitting only on spaces cannot correctly tokenize punctuation or quoted text.

Question: Which stage identifies token boundaries?

1. The lexer
2. The storage engine
3. The result formatter

Answer: 1. The parser consumes the structured token sequence produced by lexing.

Experiment: Vary whitespace around punctuation and confirm the token sequence is unchanged. Add an invalid character and check explicit rejection.

## Quoted text has its own lexical rules

A quoted string can contain spaces that would otherwise separate tokens. SQL-style doubled quotes can represent a quote within that string. The lexer must reject an unterminated token instead of consuming unrelated later input as if it were valid syntax.

Returned tokens own their text here, avoiding a borrow into an input line that might later be replaced.

```cpp
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

```

Expected output:

```text
Ada Lovelace
O'Brien
```

The first string retains its space. Two adjacent quote characters inside the second token produce one literal quote.

Pitfall: A delimiter search that ignores escape rules can terminate a valid quoted string too early.

Question: Why do the returned tokens remain usable after the input line changes?

1. All string_views extend input lifetime
2. They own string values
3. The parser never releases memory

Answer: 2. The token representation stores independent strings.

Experiment: Test an empty quoted string, a doubled quote, and a missing closing quote. Decide which empty values the later schema permits.

## Parse into a typed query value

A parser should produce a query representation rather than modify table state while syntax is still being checked. This subset accepts SELECT * FROM people with an optional WHERE id = positive-unsigned field and a required semicolon.

Select owns the parsed numeric filter through optional. Execution can inspect that value without revisiting the source text.

```cpp
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
    auto all = parse("SELECT * FROM people;");
    auto one = parse("SELECT * FROM people WHERE id=7;");
    std::cout << "all=" << !all.id << " id=" << *one.id << "\n";
}

```

Expected output:

```text
all=1 id=7
```

The first query has no ID filter; the second has a validated numeric filter equal to seven.

Pitfall: Executing a partially parsed command can mutate data before trailing syntax is rejected.

Question: When should execution begin?

1. As soon as SELECT is recognized
2. Before checking the semicolon
3. After complete syntax and field validation

Answer: 3. The query value is published only after the full command passes parsing.

Experiment: Try quoted IDs, zero, overflow, and missing punctuation. Confirm every rejected command produces no executable query value.

## Reject a valid prefix followed by extra input

Recognizing a valid statement prefix is insufficient when the command contract allows exactly one complete statement. The parser must ensure every token was consumed.

This avoids treating an appended command or misspelled suffix as harmless whitespace. A multi-statement interface would need a different explicit framing and transaction contract.

```cpp
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

```

Expected output:

```text
accepted
trailing tokens
```

The first command consumes all tokens. The second leaves SAVE after the semicolon and is rejected.

Pitfall: A parser that stops at the first semicolon without checking its remaining input silently broadens the accepted grammar.

Question: Is a valid prefix enough for this interface?

1. No, all tokens must be consumed
2. Yes
3. Only when the prefix contains WHERE

Answer: 1. The documented grammar accepts one complete statement.

Experiment: Append comments, a second SELECT, and arbitrary words. Decide which syntax belongs in the grammar before accepting it.

## Keep syntax failure separate from table mutation

Parsing and execution have different failure domains. A malformed command should never partially update an otherwise valid table. Build a typed query first, then pass that query to execution.

The example counts executions to make this sequencing observable. It is a control-flow boundary, not a full database transaction implementation.

```cpp
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
    unsigned executions = 0;
    for (auto text :
         {"SELECT * FROM people WHERE id=2;", "SELECT * FROM people WHERE id=2x;"}) {
        try {
            auto query = parse(text);
            if (query.id)
                ++executions;
        } catch (const std::exception &) {
            std::cout << "rejected\n";
        }
    }
    std::cout << "executed=" << executions << "\n";
}

```

Expected output:

```text
rejected
executed=1
```

The malformed numeric suffix prevents a query value from reaching the execution counter.

Pitfall: Rollback added after partial parsing is more complicated than keeping parsing free of table side effects.

Question: Which phase owns table side effects?

1. Lexing each character
2. Execution after parsing succeeds
3. Integer conversion itself

Answer: 2. A clean phase boundary makes rejection preservation easier to enforce.

Experiment: Replace the counter with a mock table operation and assert it is never called for malformed syntax or invalid numeric fields.

## Chapter project

Parse a documented SELECT subset and reject trailing tokens.
