export const chapters = [
  {id:'values',title:'Values before pointers',description:'Write useful programs with strings, vectors, and small functions.',project:'Build a score summary that handles an empty collection.'},
  {id:'ownership',title:'Ownership and lifetimes',description:'Make resource cleanup a property of your types.',project:'Design a move-only resource owner with a clear lifetime.'},
  {id:'algorithms',title:'Algorithms and generic code',description:'Use the standard library, then understand the costs.',project:'Build a searchable, sorted record index.'},
  {id:'boundaries',title:'Boundaries and errors',description:'Parse input, borrow safely, and preserve invariants when things fail.',project:'Reject malformed input without changing valid state.'},
  {id:'records',title:'Build a persistent record store',description:'Connect value types, validation, byte formats, and file ownership.',project:'Extend the working record store in the Workbench.'},
  {id:'engineering',title:'Engineering beyond the browser',description:'Test contracts, draw platform boundaries, and coordinate shared state.',project:'Run native investigations and document your storage guarantees.'},
];
const code = String.raw;
export const lessons = [];
function lesson(chapter,id,title,body,program,expected,walkthrough,pitfall,question,choices,answer,feedback,experiment,extra={}) {
  lessons.push({chapter,id,title,body,code:program,expected,walkthrough,pitfall,question,choices,answer,feedback,experiment,...extra});
}

lesson('values','first-program','A first C++20 program',
  ['A program starts in main. Include the header that declares the library facilities you use; iostream provides the standard output stream. C++20 is the language version for this course, not a requirement to use every new feature at once.',
   'Start by representing data as values. A std::string owns its characters and cleans them up at the end of its scope. You can concentrate on the result before studying the machinery that stores those characters.'],
code`#include <iostream>
#include <string>
int main() {
    std::string name = "Ada";
    std::cout << "Hello, " << name << "!\n";
    return 0;
}`,'Hello, Ada!',
  'The string is constructed, the stream writes three pieces of text, and returning zero reports success to the caller. The newline ends a line; it does not request an immediate flush as std::endl does.',
  'A successful compilation does not establish that the program produces the intended result. Read diagnostics and compare actual output with the contract.',
  'Who owns the characters in name?', ['The std::string value','The output stream','A caller that must call delete'],0,
  'The string owns its storage. Its destructor releases that storage automatically.',
  'Change the name and greeting, then remove a semicolon. Compare a compiler diagnostic with an incorrect but compilable greeting.');

lesson('values','numbers','Types and numeric boundaries',
  ['A type specifies a set of values and operations. Use a type that expresses the domain: counts are nonnegative, temperatures may be negative, and fractional measurements need a floating representation. auto deduces a concrete type from an initializer; it does not make the variable dynamically typed.',
   'Signed integer overflow is undefined behavior. Check the precondition before performing an addition. For floating point, a decimal value such as 0.1 need not have an exact binary representation.'],
code`#include <iostream>
#include <limits>
#include <optional>
std::optional<int> add(int a, int b) {
    if (b > 0 && a > std::numeric_limits<int>::max() - b) return std::nullopt;
    if (b < 0 && a < std::numeric_limits<int>::min() - b) return std::nullopt;
    return a + b;
}
int main() {
    auto total = add(20, 22);
    if (total) std::cout << *total << '\n';
    std::cout << "overflow rejected="
              << !add(std::numeric_limits<int>::max(), 1) << '\n';
}`,'42\noverflow rejected=1',
  'The two guards rearrange the mathematical boundary so that the check itself stays representable. An optional distinguishes a valid result, including zero, from a rejected operation.',
  'Checking whether the result became negative after an overflowing signed addition is too late: the addition has already violated the language rules.',
  'When must the overflow check happen?',['Before a + b','After computing a + b','Only in debug builds'],0,
  'The operation is valid only after its precondition has been established.',
  'Try the minimum integer plus -1, minimum plus 1, and two negative operands. Explain why each guard remains representable.');

lesson('values','collections','Strings and vectors own their elements',
  ['std::vector stores a sequence of elements and grows its storage as necessary. Its size is the number of live elements; capacity is the space currently available without reallocating. A std::string offers a similar owning model for text.',
   'Use range-for when you need each value. operator[] requires a valid index; at() checks the index and throws std::out_of_range on failure. Never rely on capacity as though those extra elements already existed.'],
code`#include <iostream>
#include <string>
#include <vector>
int main() {
    std::vector<std::string> names{"Ada", "Linus"};
    names.push_back("Grace");
    for (const auto& name : names) std::cout << name << '\n';
    std::cout << "count=" << names.size() << '\n';
}`,'Ada\nLinus\nGrace\ncount=3',
  'The vector owns three string objects. Each string owns its text. The const reference in the loop borrows each element without copying it or allowing the loop body to modify it.',
  'push_back can reallocate the vector. References, pointers, and iterators to its old elements can then dangle.',
  'Does reserve(10) create ten elements?', ['No, it reserves storage','Yes, initialized to zero','Only for strings'],0,
  'reserve changes capacity; resize changes the number of live elements.',
  'Print size before and after reserve(20), then after resize(5). Inspect the newly constructed strings.');

lesson('values','functions','Small functions and explicit contracts',
  ['A function lets you name one operation and define its inputs and result. Pass small values by value. Borrow a read-only collection by const reference when copying it would add cost without helping the operation.',
   'Define behavior for empty input. A score-summary function can return no result for an empty vector rather than dividing by zero or inventing an average. Const expresses what this function may do through its parameter; it does not guarantee that no other alias can change the object.'],
code`#include <iostream>
#include <optional>
#include <vector>
std::optional<double> mean(const std::vector<int>& scores) {
    if (scores.empty()) return std::nullopt;
    double total = 0;
    for (int score : scores) total += score;
    return total / static_cast<double>(scores.size());
}
int main() {
    const std::vector<int> scores{70, 80, 90};
    std::cout << "mean=" << *mean(scores) << '\n';
    std::cout << "empty=" << !mean({}) << '\n';
}`,'mean=80\nempty=1',
  'The early return handles the empty case. Accumulating into double avoids an overflowing int accumulator for this teaching example. Dereferencing the result is safe in main because that specific input is known to be nonempty.',
  'Do not dereference an arbitrary optional without checking it. Optional makes the possibility visible; the caller still has to honor it.',
  'What does nullopt represent here?', ['No average exists for empty input','The average is zero','An exception was caught'],0,
  'The absence of a result is distinct from a present numeric result of zero.',
  'Add negative scores and a single score. Change main to inspect the optional before printing it.');

lesson('ownership','references','References borrow; const restricts access',
  ['A reference is an alias for an existing object. It does not own that object and does not extend the lifetime of an arbitrary referred-to value. A reference parameter is useful when a function needs to update a caller-owned value.',
   'Make mutation explicit in the interface. A const reference provides read-only access through that reference, while returning a value gives the caller an independent result. Prefer those independent values when borrowing would make lifetimes difficult to reason about.'],
code`#include <iostream>
#include <string>
void append_label(std::string& name) { name += " Lovelace"; }
std::string greeting(const std::string& name) { return "Hello, " + name; }
int main() {
    std::string name = "Ada";
    append_label(name);
    auto message = greeting(name);
    name.clear();
    std::cout << message << '\n';
    std::cout << "name empty=" << name.empty() << '\n';
}`,'Hello, Ada Lovelace\nname empty=1',
  'append_label modifies the caller’s string. greeting constructs a new string, so clearing the original name does not change message.',
  'Returning a reference to a local variable leaves the caller with a dangling reference after the function returns.',
  'Why does message survive name.clear()?', ['It owns a separate string','All references copy their targets','clear never changes strings'],0,
  'The return type is std::string, so the returned result is an owning value.',
  'Change append_label to take its parameter by value. Predict whether main’s name changes, then run the program.');

lesson('ownership','invariants','Value types and invariants',
  ['A struct groups related values. A class can additionally control how those values change. An invariant is a condition that every publicly observable valid object must satisfy.',
   'A bounded score type can check construction once and then expose only operations that preserve its range. Exceptions are one way to report rejected construction; later lessons compare this with ordinary optional results.'],
code`#include <iostream>
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
}`,'90\nscore 0..100',
  'The constructor either establishes the range invariant or throws. Callers cannot write value_ directly, so an already valid Score cannot be changed to 101 through this interface.',
  'A getter alone does not make a type safe if another public member or a mutable reference still allows invalid state.',
  'When does a Score become a valid constructed object?', ['After its constructor finishes successfully','Before validation begins','Whenever storage is allocated'],0,
  'A constructor that throws does not produce a successfully constructed Score.',
  'Add a set operation that checks its candidate value before changing value_. Verify that rejection preserves the old score.');

lesson('ownership','raii','RAII ties cleanup to scope',
  ['RAII means acquiring a resource as part of an object’s initialization and releasing it in its destructor. The resource might be memory, a file, or a lock. Normal returns and exception unwinding both destroy fully constructed automatic objects.',
   'Destructors should release resources without throwing. Cleanup is often best delegated to existing owners such as std::vector, std::unique_ptr, std::fstream, and std::lock_guard. You do not need a custom destructor when members already do the right thing.'],
code`#include <iostream>
#include <stdexcept>
struct Guard {
    Guard() { std::cout << "acquire\n"; }
    ~Guard() { std::cout << "release\n"; }
};
void work() {
    Guard guard;
    std::cout << "work\n";
    throw std::runtime_error("failed");
}
int main() {
    try { work(); }
    catch (const std::runtime_error& error) { std::cout << error.what() << '\n'; }
}`,'acquire\nwork\nrelease\nfailed',
  'The guard finishes construction before work throws. Stack unwinding calls its destructor before control enters main’s catch handler. The output makes that order observable.',
  'RAII does not guarantee cleanup after process termination, power loss, or a Wasm trap. Exception unwinding and abrupt termination have different contracts.',
  'Does the destructor run before the catch handler?', ['Yes, during unwinding','No, only at program exit','Only if called manually'],0,
  'The local guard’s scope is left while the exception travels to the matching handler.',
  'Add a second guard with a label and observe reverse construction order. Replace the throw with return and compare.');

lesson('ownership','moves','Unique ownership and moving',
  ['Prefer ordinary values first. When an object needs a separate lifetime or stable address, std::unique_ptr expresses one owner. Copying it is disabled, so two independent owners cannot accidentally delete the same object.',
   'std::move is a cast that permits moving; the selected move operation performs the transfer. A moved-from unique_ptr is empty. Other moved-from library objects are generally valid but have an unspecified value unless their contract says more.'],
code`#include <iostream>
#include <memory>
#include <string>
#include <utility>
int main() {
    auto first = std::make_unique<std::string>("page 7");
    auto second = std::move(first);
    std::cout << "first empty=" << !first << '\n';
    std::cout << "second=" << *second << '\n';
    second.reset();
    std::cout << "second empty=" << !second << '\n';
}`,'first empty=1\nsecond=page 7\nsecond empty=1',
  'make_unique constructs the string and returns its owner. Moving transfers that ownership to second. reset destroys the owned string and leaves second empty.',
  'A raw pointer obtained with get() borrows the object. It becomes invalid when the owning unique_ptr destroys the object.',
  'Does std::move(first) itself allocate a second string?', ['No, the unique_ptr move transfers ownership','Yes, it deep-copies the text','Only when the string is long'],0,
  'The unique_ptr move transfers the stored pointer; it does not copy the pointed-to string.',
  'Attempt auto third = second before reset. Read the deleted-copy diagnostic, then explicitly transfer ownership instead.');

lesson('algorithms','sorting','Algorithms separate intent from iteration',
  ['An algorithm names an operation over a range. std::ranges::sort makes the ordering step explicit and can use a projection to choose a record field. It rearranges the existing elements; it does not create an independent sorted collection.',
   'Sorting N elements takes O(N log N) comparisons. Binary search then takes O(log N) comparisons on a random-access sorted range, but maintaining that order has a cost. Measure the actual workload before assuming that a sorted vector is the right index.'],
code`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
struct Person { int id; std::string name; };
int main() {
    std::vector<Person> people{{3,"Grace"},{1,"Ada"},{2,"Linus"}};
    std::ranges::sort(people, {}, &Person::id);
    for (const auto& person : people)
        std::cout << person.id << ' ' << person.name << '\n';
    bool found = std::ranges::binary_search(people, 2, {}, &Person::id);
    std::cout << "found=" << found << '\n';
}`,'1 Ada\n2 Linus\n3 Grace\nfound=1',
  'The projection &Person::id compares IDs without writing a custom iterator loop. The binary search uses the same ordering and projection as the sort.',
  'Binary search requires the range to be partitioned appropriately for the search key and comparison. Sorting by name and then searching by ID violates that precondition in general.',
  'What must sort and binary_search agree on?', ['The ordering and projected key','The number of output lines','The vector capacity'],0,
  'A search can discard half the range only when its ordering assumptions match the data.',
  'Search for an absent ID. Then insert a new smallest ID at the end and restore the sorted invariant before searching again.');

lesson('algorithms','maps','Choose an index for its contract',
  ['std::map keeps keys ordered and provides logarithmic lookup, insertion, and removal. std::unordered_map uses hashing and offers average constant-time lookup, with linear worst cases. Neither choice removes the need to specify uniqueness and failure behavior.',
   'Use find for a read-only lookup. operator[] on a map inserts a default-constructed value when the key is missing. try_emplace gives an explicit inserted flag and leaves an existing value in place.'],
code`#include <iostream>
#include <map>
#include <string>
int main() {
    std::map<int,std::string> names;
    auto [position, inserted] = names.try_emplace(1,"Ada");
    std::cout << "inserted=" << inserted << '\n';
    auto duplicate = names.try_emplace(1,"Grace");
    std::cout << "duplicate=" << !duplicate.second << '\n';
    std::cout << position->second << '\n';
    std::cout << "missing=" << (names.find(9) == names.end()) << '\n';
    std::cout << "size=" << names.size() << '\n';
}`,'inserted=1\nduplicate=1\nAda\nmissing=1\nsize=1',
  'The second insertion reports a duplicate and preserves Ada. The unsuccessful find does not create key 9, so the final size is still one.',
  'Using map[key] merely to ask whether a key exists can change the collection and conceal a missing-record bug.',
  'Which operation checks without inserting?', ['find','operator[]','try_emplace with an empty name'],0,
  'find observes the collection; operator[] is also a mutation operation for absent keys.',
  'Replace find(9) with names[9], then explain the new size and empty string. Compare ordered iteration with unordered_map.');

lesson('algorithms','ranges','Views describe a lazy computation',
  ['A range view often borrows its input and produces elements on demand. Composing filter and transform describes a pipeline without immediately allocating another collection. The source must remain alive while a borrowing view is used.',
   'Laziness is useful, but does not imply that every operation is cheap or evaluated once. A predicate or projection can be called again as you traverse. Keep those functions free of surprising side effects.'],
code`#include <iostream>
#include <ranges>
#include <vector>
int main() {
    const std::vector<int> scores{40,70,90,50};
    auto passing = scores
        | std::views::filter([](int score) { return score >= 60; })
        | std::views::transform([](int score) { return score + 5; });
    for (int score : passing) std::cout << score << '\n';
    std::cout << "original=" << scores[1] << '\n';
}`,'75\n95\noriginal=70',
  'filter admits 70 and 90, then transform produces 75 and 95. The transform returns values and does not modify the const source vector.',
  'Returning a borrowing view of a local vector can leave the caller with dangling storage. Materialize an owning result when the source cannot outlive the view.',
  'Where are 75 and 95 stored before iteration?', ['They are computed on demand','In a second vector created by filter','In the original vector'],0,
  'This pipeline computes transformed values as it is traversed.',
  'Traverse the view twice with a counter in the transform. Explain why side effects can make a lazy pipeline harder to understand.');

lesson('algorithms','concepts','Constrain templates to express intent',
  ['A function template describes a family of functions. A concept constrains which types belong to that family. A readable constraint can move an error to the call site instead of leaving it deep inside a template implementation.',
   'A constraint describes operations and semantic expectations; it does not prove arbitrary properties of an algorithm. std::integral accepts signed and unsigned integer types. Our sum example uses bounded positive values so that its arithmetic remains representable.'],
code`#include <concepts>
#include <iostream>
#include <span>
template <std::integral T>
T total(std::span<const T> values) {
    T result{};
    for (T value : values) result += value;
    return result;
}
int main() {
    const int values[]{2,3,4};
    std::cout << total<int>(values) << '\n';
}`,'9',
  'The compiler instantiates total<int>. A span passes a pointer and count as one borrowing interface. It does not copy the array or own its storage.',
  'A concept such as integral does not establish that a sum cannot overflow. Numeric contracts still need domain bounds or checked arithmetic.',
  'Does std::integral prove addition cannot overflow?', ['No','Yes, for signed integers','Yes, when using span'],0,
  'The concept checks the kind of type; representability depends on the actual values and operations.',
  'Attempt total<double> with a double array and read the constraint diagnostic. Design a checked-total variant using optional.');

lesson('boundaries','borrowing','Borrowed views need a lifetime plan',
  ['std::span and std::string_view package borrowed access to a sequence. They are useful for accepting arrays, vector elements, or text without owning a copy. Neither keeps the underlying storage alive.',
   'A string_view is not necessarily null-terminated. Use operations that understand its length, and create a std::string if an interface needs an owning or terminated string. A span also requires valid indices: it is not an automatic bounds-checking wrapper.'],
code`#include <iostream>
#include <span>
#include <string>
#include <string_view>
int main() {
    std::string text = "Ada Lovelace";
    std::string_view first(text.data(),3);
    std::cout << first << '\n';
    int values[]{10,20,30};
    std::span<int> middle(values + 1,1);
    middle[0] += 2;
    std::cout << values[1] << '\n';
    std::string copy(first);
    text.clear();
    std::cout << copy << '\n';
}`,'Ada\n22\nAda',
  'The span aliases the second array element, so the mutation is visible through values. copy owns its characters; it remains valid after the source string changes. The view is not used after clear.',
  'A view can dangle after its owner is destroyed or reallocates. Mutating an owner can also invalidate the view’s usable range without moving its allocation.',
  'Which object owns the characters after text.clear()?', ['copy','first','Both views keep text alive'],0,
  'copy is a separate string. first still carries its old pointer and length and must not be used as a valid view of the cleared string.',
  'Write a prefix function returning string_view. Document that its caller must keep the input’s storage alive and unchanged while using the result.');

lesson('boundaries','parsing','Parse the entire field',
  ['Parsing converts untrusted text into a domain value. std::from_chars reports an error code and the point where parsing stopped. Success is not enough if the grammar requires the whole field to contain a number.',
   'Keep conversion and validation separate. This helper accepts decimal digits in a bounded unsigned domain. It rejects empty input, trailing characters, negative values, and out-of-range values before returning a result.'],
code`#include <charconv>
#include <iostream>
#include <optional>
#include <string_view>
#include <system_error>
std::optional<unsigned> parse_id(std::string_view text) {
    unsigned value = 0;
    auto [end,error] = std::from_chars(text.data(),text.data()+text.size(),value);
    if (error != std::errc{} || end != text.data()+text.size() || value == 0)
        return std::nullopt;
    return value;
}
int main() {
    for (auto text : {"42","42x","-1","0","99999999999999999999"}) {
        auto value = parse_id(text);
        std::cout << text << ": " << (value ? "valid" : "invalid") << '\n';
    }
}`,'42: valid\n42x: invalid\n-1: invalid\n0: invalid\n99999999999999999999: invalid',
  '42x contains a valid numeric prefix, but end does not point to the field’s end. The helper therefore rejects it rather than silently accepting 42.',
  'from_chars does not skip leading whitespace like formatted stream extraction. Choose a grammar and handle whitespace deliberately.',
  'Why check both error and end?', ['A valid prefix can leave trailing garbage','The error code is always empty','The end pointer owns the input'],0,
  'The error code describes conversion; the end pointer tells you whether the whole field was consumed.',
  'Try empty input, a leading space, +42, and the largest unsigned value. Add a separate upper bound for your application.');

lesson('boundaries','failure','Exceptions and failure preservation',
  ['An exception can propagate a failure across intermediate calls to a handler. Catch standard exceptions by const reference so their dynamic type and message are preserved. RAII releases owned resources as control unwinds.',
   'The strong exception guarantee means a failed operation has no observable effect on the promised state. A simple way to achieve it is to construct and validate a candidate before committing it with an operation known not to throw.'],
code`#include <iostream>
#include <stdexcept>
#include <string>
void rename(std::string& current, const std::string& next) {
    std::string candidate = next;
    if (candidate.empty()) throw std::invalid_argument("empty name");
    current.swap(candidate);
}
int main() {
    std::string name = "Ada";
    try { rename(name,""); }
    catch (const std::invalid_argument& error) { std::cout << error.what() << '\n'; }
    std::cout << "preserved=" << name << '\n';
    rename(name,"Grace");
    std::cout << "committed=" << name << '\n';
}`,'empty name\npreserved=Ada\ncommitted=Grace',
  'Allocation and validation happen while current is untouched. With the standard string allocator used here, swap is nonthrowing. The old string becomes the local candidate and is destroyed on return.',
  'Catching an exception after partially mutating state does not automatically roll that mutation back.',
  'What makes this commit safe?', ['All fallible preparation precedes a nonthrowing swap','The catch handler reverses every write','Strings never allocate'],0,
  'Preparation leaves current alone, and the final swap commits the validated candidate.',
  'Add a maximum-name-length rule before swap. Verify that both invalid cases preserve current.');

lesson('boundaries','sum-types','Model alternatives explicitly',
  ['Use optional when the outcome is a value or absence. Use variant when a value can take one of several different forms. A named error value can carry useful context without using an exception for an expected validation result.',
   'C++20 does not include std::expected. Here a variant of an unsigned value and an error string makes both alternatives visible. std::visit requires a visitor that can handle every alternative.'],
code`#include <iostream>
#include <string>
#include <variant>
using Result = std::variant<unsigned,std::string>;
Result score(int value) {
    if (value < 0 || value > 100) return std::string("score outside 0..100");
    return static_cast<unsigned>(value);
}
int main() {
    for (int value : {90,101}) {
        Result result = score(value);
        std::visit([](const auto& item) { std::cout << item << '\n'; },result);
    }
}`,'90\nscore outside 0..100',
  'The generic visitor is instantiated for both possible alternatives. It prints a present score or the error message, and the caller cannot confuse an invalid score with zero.',
  'Getting the wrong variant alternative with std::get throws bad_variant_access. Inspect the active alternative or use visit.',
  'Is std::expected part of C++20?', ['No, it was added in C++23','Yes','Only in Wasm'],0,
  'Choose facilities from the course’s language baseline; variant and optional are available in C++20.',
  'Replace the error string with a named Error struct containing a code and message. Extend the visitor to format it.');

lesson('records','row-model','Represent rows as owning values',
  ['A database row is a domain value, not a pointer into an editor or input buffer. Give it owning fields, then define the rules for a valid row. The capstone uses a positive uint32 ID, a name of 1–63 UTF-8 bytes, and a score from 0 to 100.',
   'Representability and domain validity are different checks. Zero fits in uint32_t, but the application rejects it as an ID. A useful validation function can be reused at the parser, insertion, and file-import boundaries.'],
code`#include <cstdint>
#include <iostream>
#include <string>
struct Row { std::uint32_t id; std::string name; unsigned score; };
bool valid(const Row& row) {
    return row.id != 0 && !row.name.empty() && row.name.size() <= 63 && row.score <= 100;
}
int main() {
    const Row good{1,"Ada",90};
    const Row bad{0,"",101};
    std::cout << "good=" << valid(good) << '\n';
    std::cout << "bad=" << valid(bad) << '\n';
}`,'good=1\nbad=0',
  'This example checks the shape and scalar bounds. The complete capstone additionally validates UTF-8 and rejects control characters in names before accepting a row.',
  'std::string::size counts bytes, not Unicode characters. Choose and document which limit your file format enforces.',
  'What does name.size() count?', ['Bytes stored in the string','Unicode characters in every encoding','Words'],0,
  'std::string is a sequence of char units; the capstone explicitly treats those units as UTF-8 bytes.',
  'Try an empty name and a 64-byte name. Add a printable-name rule and apply it at every ingestion boundary.');

lesson('records','crud','Uniqueness and updates are contracts',
  ['An insert should distinguish a new row from a duplicate ID. An update should distinguish an existing row from a missing one. Those are observable API decisions, not incidental details of the underlying container.',
   'An ordered map gives this first store unique IDs and deterministic listing. It is an in-memory index, not a disk B-tree. The capstone serializes the complete bounded table when saving; it does not claim page-level updates or transactions.'],
code`#include <iostream>
#include <map>
#include <string>
struct Row { std::string name; unsigned score; };
int main() {
    std::map<unsigned,Row> rows;
    auto inserted = rows.try_emplace(1,Row{"Ada",90});
    auto duplicate = rows.try_emplace(1,Row{"Wrong",0});
    std::cout << "inserted=" << inserted.second << '\n';
    std::cout << "duplicate=" << !duplicate.second << '\n';
    if (auto found = rows.find(1); found != rows.end()) found->second.score = 95;
    std::cout << rows.at(1).name << ' ' << rows.at(1).score << '\n';
    std::cout << "removed=" << rows.erase(1) << '\n';
    std::cout << "count=" << rows.size() << '\n';
}`,'inserted=1\nduplicate=1\nAda 95\nremoved=1\ncount=0',
  'try_emplace preserves the first row on duplicate insertion. find checks existence before mutation, and erase reports the number removed.',
  'A convenient container operation can violate your domain contract: insert_or_assign would replace a duplicate, while operator[] could create a missing row during an update.',
  'Which insertion preserves an existing row?', ['try_emplace','insert_or_assign','operator[] followed by assignment'],0,
  'try_emplace reports the duplicate and leaves its mapped value unchanged.',
  'Add an update for ID 9 that reports missing without changing size. Test deletion twice.');

lesson('records','byte-format','Define bytes independently of object layout',
  ['Never persist a C++ object by writing sizeof(object) bytes. Padding, endianness, pointer fields, and library object layout do not form a portable file format. Define the field widths, byte order, and validation rules explicitly.',
   'The capstone uses a CPF1 magic header, a little-endian uint32 row count, and rows containing ID, score, a one-byte name length, and UTF-8 bytes. Imports reject duplicates, invalid fields, truncation, excess rows, and trailing bytes before replacing live state.'],
code`#include <array>
#include <cstdint>
#include <iostream>
std::array<unsigned char,4> encode(std::uint32_t value) {
    std::array<unsigned char,4> result{};
    for (unsigned i=0;i<4;++i) result[i]=static_cast<unsigned char>((value>>(8*i))&255u);
    return result;
}
std::uint32_t decode(const std::array<unsigned char,4>& bytes) {
    std::uint32_t value=0;
    for (unsigned i=0;i<4;++i) value |= std::uint32_t(bytes[i]) << (8*i);
    return value;
}
int main() {
    auto bytes=encode(0x12345678u);
    for (auto byte:bytes) std::cout << std::hex << unsigned(byte) << ' ';
    std::cout << "\nroundtrip=" << (decode(bytes)==0x12345678u) << '\n';
}`,'78 56 34 12 \nroundtrip=1',
  'The low byte is written first, regardless of the host’s native endianness. Converting each byte to uint32_t before shifting avoids signed promotion surprises.',
  'A roundtrip test alone can miss a shared encoder/decoder bug. Also compare against independently specified exact bytes.',
  'Why test exact bytes as well as roundtrips?', ['Both functions could share the same mistake','Exact bytes are faster to compile','Roundtrips require threads'],0,
  'Independent format expectations catch a pair of functions that agree with each other but violate the external contract.',
  'Write expected bytes for 0, 255, 256, and UINT32_MAX before running. In the Workbench, export a CPF1 file and inspect its header.');

lesson('records','persistence','Close, reopen, and validate',
  ['A file stream owns a file handle. Check opening and writing, then check close explicitly when publishing output: destructors cannot conveniently report a late close failure. Read into a candidate collection so a rejected import does not partially overwrite current state.',
   'This example demonstrates reopening a temporary lesson file. The Workbench runs the complete capstone against people.cpf and saves that file in IndexedDB after successful runs. Browser storage is separate from native filesystem durability; download a backup for work you want to keep.'],
code`#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
int main() {
    {
        std::ofstream out("snapshot.txt",std::ios::binary|std::ios::trunc);
        if (!out) throw std::runtime_error("open failed");
        out << "1 Ada 90\n";
        out.close();
        if (!out) throw std::runtime_error("write or close failed");
    }
    std::ifstream in("snapshot.txt",std::ios::binary);
    std::string line;
    if (!std::getline(in,line)) throw std::runtime_error("read failed");
    std::cout << "reopened: " << line << '\n';
}`,'reopened: 1 Ada 90',
  'The writer is closed before the reader opens the file. In the capstone, SAVE writes a candidate file and publishes it with rename; LOAD validates the complete binary format before swapping tables.',
  'An ofstream close followed by rename is not a power-loss durability protocol. Native sync and directory-publication behavior depend on the host; the browser adds its own storage layer.',
  'Does this example prove power-loss durability?', ['No, it proves the demonstrated reopen behavior','Yes, because binary mode is enabled','Yes, because the stream uses RAII'],0,
  'Durability requires a documented platform and failure model beyond the C++ stream abstraction.',
  'Open the Workbench. INSERT two rows, SAVE, reload the page, and LIST. Export the database, then try importing a truncated copy.');

lesson('engineering','contracts','Test properties as well as examples',
  ['A worked example establishes one concrete behavior. A test suite should also target empty input, boundaries, rejection preservation, and relationships that hold across a family of cases. Use an independent expected result where possible.',
   'Here a sorting check compares against a known sequence and also verifies idempotence: sorting an already sorted range does not change it. Idempotence alone would not catch a sort that always returned its input unchanged.'],
code`#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <vector>
void require(bool condition) {
    if (!condition) throw std::runtime_error("contract failed");
}
int main() {
    std::vector<int> values{3,1,2,1};
    std::ranges::sort(values);
    require(values == std::vector<int>({1,1,2,3}));
    auto first=values;
    std::ranges::sort(values);
    require(values == first);
    std::vector<int> empty;
    std::ranges::sort(empty);
    require(empty.empty());
    std::cout << "3 contracts passed\n";
}`,'3 contracts passed',
  'The exact expected result checks ordering and duplicate preservation. The second check verifies repeat behavior. The empty case checks a boundary without relying on an unchecked optional or invalid index.',
  'Tests that merely repeat the implementation’s logic can reproduce its mistakes. Design an oracle or property independently.',
  'Would idempotence alone prove sorting is correct?', ['No, doing nothing is also idempotent','Yes','Only for integers'],0,
  'Combine properties with independent expected outcomes and meaningful boundary cases.',
  'Add reversed, all-equal, single-element, and negative-value cases. For the capstone, check that a rejected duplicate leaves the original bytes unchanged.');

lesson('engineering','portability','Separate language guarantees from host contracts',
  ['C++20 standardizes many facilities, but does not make every platform interchangeable. Numeric widths, path encodings, filesystem replacement behavior, and external byte formats each need a documented contract.',
   'Use static assertions for compile-time assumptions and runtime checks for data. The capstone explicitly requires octets and uint32_t. It avoids serializing std::string or map internals, so those library representations do not leak into its file format.'],
code`#include <climits>
#include <cstdint>
#include <iostream>
#include <limits>
static_assert(CHAR_BIT == 8,"CPF1 requires octets");
static_assert(std::numeric_limits<std::uint32_t>::digits == 32);
int main() {
    std::cout << "byte bits=" << CHAR_BIT << '\n';
    std::cout << "uint32 bits=" << std::numeric_limits<std::uint32_t>::digits << '\n';
    std::cout << "portable format uses explicit bytes\n";
}`,'byte bits=8\nuint32 bits=32\nportable format uses explicit bytes',
  'A host that cannot satisfy the format’s scalar assumptions fails at compilation instead of silently creating incompatible files. This does not establish that rename replacement behaves identically on all hosts.',
  'A successful build on one operating system does not prove cross-host file compatibility or identical filesystem semantics.',
  'What does static_assert verify?', ['A compile-time condition on this implementation','Every possible input file','Power-loss behavior'],0,
  'It checks implementation assumptions; file validation and host-specific behavior need separate checks.',
  'Build the exported source with another compiler. Exchange a saved file between hosts and document any filesystem adapter differences.');

lesson('engineering','threads','Protect a shared invariant with a lock',
  ['Two threads that access the same non-atomic object concurrently, with at least one write and without synchronization, can cause a data race. A data race is undefined behavior, not simply an occasional wrong answer.',
   'A mutex protects a chosen invariant only if every access follows the same locking protocol. lock_guard uses RAII to release the lock. This native lesson uses jthread, which joins on destruction; we also join explicitly before observing the final result.'],
code`#include <iostream>
#include <mutex>
#include <thread>
int main() {
    int count=0;
    std::mutex mutex;
    auto increment=[&] {
        for (int i=0;i<10000;++i) {
            std::lock_guard lock(mutex);
            ++count;
        }
    };
    std::jthread first(increment),second(increment);
    first.join(); second.join();
    std::cout << "count=" << count << '\n';
}`,'count=20000',
  'Each increment runs while owning the same mutex. Joining both threads establishes that their work has finished before main reads count.',
  'Locking writes while leaving concurrent reads unlocked does not protect a non-atomic shared value. One atomic counter also does not protect an entire multi-field database invariant.',
  'Must a concurrent reader follow the locking protocol?', ['Yes, for this non-atomic shared state','No, reads cannot race','Only if count is negative'],0,
  'A conflicting read and write can form a data race even when only the writer locks.',
  'Run the native example, then design a locked two-field update. Use ThreadSanitizer where your host supports it; do not infer race freedom from one successful run.',{native:true,flags:'-pthread'});

lesson('engineering','publication','Publish initialized data with acquire/release',
  ['An atomic flag can publish a fully initialized object when the writer uses a release operation and the reader observes it with an acquire operation. The synchronization makes preceding writes visible; it does not grant permission to keep modifying the published object concurrently.',
   'This single-writer, single-publication example keeps the vector alive until the reader joins. A general snapshot system also needs ownership and reclamation rules. Atomics do not automatically supply those rules.'],
code`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>
int main() {
    std::vector<int> values;
    std::atomic<bool> ready{false};
    int observed=0;
    std::jthread reader([&] {
        while (!ready.load(std::memory_order_acquire)) std::this_thread::yield();
        for (int value:values) observed += value;
    });
    values={10,20,30};
    ready.store(true,std::memory_order_release);
    reader.join();
    std::cout << "snapshot sum=" << observed << '\n';
}`,'snapshot sum=60',
  'The reader observes the release through its acquire load before accessing values. The writer performs no later vector mutation, and joining the reader precedes main’s read of observed.',
  'Changing the flag to relaxed removes this publication guarantee. Reusing the flag for many updates also requires a new protocol; this example proves only one publication.',
  'Can the writer freely mutate values after publishing?', ['No, that needs additional synchronization','Yes, the flag makes all data atomic','Only when the vector capacity stays fixed'],0,
  'Publication establishes visibility of prior writes. It does not synchronize future conflicting accesses.',
  'Draw the happens-before chain from vector initialization to the reader. Extend to immutable snapshots using shared ownership and a documented replacement protocol.',{native:true,flags:'-pthread'});

export const byId = new Map(lessons.map(item => [item.id,item]));
