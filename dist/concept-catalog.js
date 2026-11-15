export const concepts=[
  {
    "id": "object",
    "pattern": "\\bobject\\b",
    "definition": "In C++, an object is a particular stored value with a type, such as one integer variable or one string. A type describes what kind of value it is; an object is one particular instance of that type."
  },
  {
    "id": "class-members",
    "pattern": "\\bclass\\b",
    "definition": "class defines a user-written type containing data members and member functions. A member function acts on a particular object. public marks the interface callers may use; private hides implementation members from ordinary callers."
  },
  {
    "id": "initialization",
    "pattern": "initializer",
    "definition": "Initialization supplies an object’s starting value when it is created. Assignment replaces a value in an object that already exists; the two steps can have different rules for user-defined types."
  },
  {
    "id": "pointer",
    "pattern": "pointer",
    "definition": "A pointer stores a location through which a program may access an object. In declarations, T* is a pointer type; *p accesses the pointed-to value and &value obtains its address. A pointer is usable only while its target is alive and the access is allowed."
  },
  {
    "id": "reference",
    "pattern": "reference",
    "definition": "A reference is another name for an existing object. In a declaration, T& gives access to that object rather than creating a separate T value; the referenced object must still exist when used."
  },
  {
    "id": "exception",
    "pattern": "throw",
    "definition": "An exception is a way to report a failure that leaves the current calculation. throw starts that report; a matching catch in a try/catch statement handles it. Without a matching handler, the program can terminate instead of producing a normal result."
  },
  {
    "id": "template",
    "pattern": "template",
    "definition": "A template describes a family of types or functions parameterized by types or values. For example, vector<int> selects an integer-element version of vector; template<class T> names a type parameter T in your own generic definition."
  },
  {
    "id": "const",
    "pattern": "\\bconst\\b",
    "definition": "const prevents changing a value through this particular name or access path. It does not say that every other part of the program is unable to change the same object."
  },
  {
    "id": "auto",
    "pattern": "\\bauto\\b",
    "definition": "auto asks the compiler to determine a variable’s type from the value used to initialize it. The variable still has one fixed type; it does not change type as the program runs."
  },
  {
    "id": "index",
    "pattern": "\\bindex",
    "definition": "An index is a whole-number position in a sequence. C++ sequences count their first element as position zero; a sequence of size n has valid positions from 0 through n - 1."
  },
  {
    "id": "boolean-operators",
    "pattern": "&&",
    "definition": "For true/false conditions, ! means not, && means both conditions must be true, and || means at least one must be true. Built-in && and || evaluate left to right and can skip the right-hand check when the answer is already determined. When std::cout prints an ordinary bool without special formatting, false appears as 0 and true as 1."
  },
  {
    "id": "for-counter",
    "pattern": "for\\s*\\([^;)]*;",
    "definition": "A counting for loop puts three steps inside its parentheses: a starting instruction, a condition checked before each repetition, and an update after each repetition. Semicolons separate those steps; ++ increases a counter by one."
  },
  {
    "id": "empty",
    "pattern": "\\.empty\\(",
    "definition": "empty() asks whether a collection currently has no elements. It produces true for no elements and false otherwise; checking this before accessing a first element prevents an invalid access."
  },
  {
    "id": "array",
    "pattern": "std::array",
    "definition": "std::array<T, N> stores exactly N elements of type T. Unlike vector, its number of elements is fixed as part of the type; braces provide starting values."
  },
  {
    "id": "struct",
    "pattern": "\\bstruct\\b",
    "definition": "struct defines a new type with named pieces of data called members. An object of that type holds its own member values, and the dot notation object.member accesses one of them."
  },
  {
    "id": "cast",
    "pattern": "static_cast",
    "definition": "static_cast<T>(value) explicitly requests conversion to type T. It does not automatically check that the original value fits; the surrounding code must establish that the conversion preserves the information it needs."
  },
  {
    "id": "optional",
    "pattern": "std::optional",
    "definition": "std::optional<T> holds either one T value or no value. std::nullopt denotes the no-value state. Test engagement with if (result) before using *result to read its value; this * is access to the contained value, not multiplication."
  },
  {
    "id": "function-overload",
    "pattern": "overload",
    "definition": "Overloads are functions with the same name but different parameter lists. The compiler chooses which one to call from the argument types and available conversions, not from the output you want."
  },
  {
    "id": "translation-unit",
    "pattern": "translation unit",
    "definition": "A translation unit is one source file after its included headers have been processed. The compiler checks and translates these units separately; the linker later connects references to definitions in other units."
  },
  {
    "id": "header-guard",
    "pattern": "#ifndef",
    "definition": "A header guard uses preprocessor instructions to include a header’s contents at most once in a translation unit. #ifndef tests whether a marker is absent, #define records it, and #endif ends the conditional region."
  },
  {
    "id": "structured-binding",
    "pattern": "auto\\s*\\[",
    "definition": "A structured binding gives separate local names to pieces of one returned value: auto [a, b] = result; names its two components. Whether these are copies or references depends on the declaration."
  },
  {
    "id": "iterator",
    "pattern": "iterator",
    "definition": "An iterator is a value used to visit positions in a sequence. begin identifies the first position and end marks the position just after the last; end is a stopping marker and must not be read as an element."
  },
  {
    "id": "half-open",
    "pattern": "half-open",
    "definition": "A half-open interval [a, b) includes a and excludes b. It describes an empty interval when a equals b and lets the end position be a stopping marker without referring to an element there."
  },
  {
    "id": "capacity",
    "pattern": "capacity",
    "definition": "A vector’s size counts actual elements. Its capacity counts how many elements its current storage could hold without growing. Reserving storage changes capacity, not the number of elements available to read."
  },
  {
    "id": "reallocation",
    "pattern": "reallocat",
    "definition": "Reallocation replaces a container’s backing storage with a different storage area. Saved references, pointers, and iterators into the old area may no longer be usable; each container operation has its own invalidation rules."
  },
  {
    "id": "string-view",
    "pattern": "std::string_view",
    "definition": "std::string_view describes a stretch of characters without owning or copying those characters. It records a starting position and a length; the original characters must outlive every use of the view."
  },
  {
    "id": "span",
    "pattern": "std::span",
    "definition": "std::span<T> is a view of consecutive T elements owned elsewhere. It gives a starting position and an element count without extending the underlying storage’s lifetime."
  },
  {
    "id": "enum",
    "pattern": "enum class",
    "definition": "enum class defines a type whose alternatives have names, such as Command::save. The double colon selects a name belonging to that type; an external number or text still needs validation before being treated as an alternative."
  },
  {
    "id": "constructor",
    "pattern": "constructor",
    "definition": "A constructor is the initialization function for a user-defined type. It has the type’s name and establishes the object’s starting state; successful construction is what makes the object ready for its promised operations."
  },
  {
    "id": "destructor",
    "pattern": "destructor",
    "definition": "A destructor is a type’s cleanup function, spelled with ~ before the type name. For a successfully constructed ordinary local object, it runs when that object’s lifetime ends, including when a handled failure leaves its block."
  },
  {
    "id": "invariant",
    "pattern": "invariant",
    "definition": "An invariant is a statement that must remain true at a specified point, such as “this stored ID is positive” or “these keys are sorted.” State the exact condition and where it must hold before using it to justify an operation."
  },
  {
    "id": "precondition",
    "pattern": "precondition",
    "definition": "A precondition is something that must already be true before an operation is used, such as “the sequence is not empty.” A postcondition describes what the operation promises afterward if its requirements were met."
  },
  {
    "id": "undefined-behavior",
    "pattern": "undefined behavior",
    "definition": "Undefined behavior means the C++ rules place no requirements on what the program does after that invalid operation. An apparently correct result on one run is not evidence of safety; prevent the invalid operation before executing it."
  },
  {
    "id": "integer-limits",
    "pattern": "numeric_limits",
    "definition": "std::numeric_limits<T> describes limits of a numeric type T. For whole-number types, min() and max() give the smallest and largest representable values; use those limits before arithmetic or conversion can exceed them."
  },
  {
    "id": "unsigned",
    "pattern": "\\bunsigned\\b",
    "definition": "An unsigned integer type represents nonnegative whole numbers. Its arithmetic wraps modulo the number of representable values; that defined wrapping can still be the wrong behavior for a count or size calculation."
  },
  {
    "id": "lambda",
    "pattern": "\\[[^\\]\\n]*\\]\\s*\\(",
    "definition": "A lambda is a function written directly where it is needed. Its [ ] capture list says which surrounding local values it uses, its parentheses describe inputs, and its braces contain the instructions. [x] stores a copy of x; [&x] borrows x and therefore needs x to remain alive."
  },
  {
    "id": "access-control",
    "pattern": "\\bprivate:",
    "definition": "class and struct can group operations with data. public members are available to callers; private members are accessible only to the type’s own implementation and permitted friends. A member function uses the current object’s data."
  },
  {
    "id": "initializer-list",
    "pattern": "initializer.list",
    "definition": "A braced list such as {1, 2, 3} can supply starting values or a short sequence to visit. Its meaning depends on the destination or operation; it does not always construct a vector."
  },
  {
    "id": "move",
    "pattern": "std::move",
    "definition": "std::move(value) makes the expression eligible for operations that may transfer resources from value. The cast itself transfers nothing. The original object still exists afterward, with usable operations determined by its type’s moved-from contract."
  },
  {
    "id": "unique-ptr",
    "pattern": "std::unique_ptr",
    "definition": "std::unique_ptr<T> is an owner that arranges to destroy a managed T when that ownership ends. It cannot be copied into a second independent owner; moving it can transfer the ownership. make_unique<T>(...) constructs the managed object and its owner together."
  },
  {
    "id": "shared-ptr",
    "pattern": "std::shared_ptr",
    "definition": "std::shared_ptr<T> lets multiple owners keep one managed object alive. Releasing the last owner destroys that object. Shared lifetime does not make reads and writes to the object automatically safe across threads."
  },
  {
    "id": "weak-ptr",
    "pattern": "std::weak_ptr",
    "definition": "std::weak_ptr<T> observes an object managed by shared ownership without keeping it alive. lock() attempts to obtain a temporary shared owner; check whether that attempt succeeded before using the value."
  },
  {
    "id": "noexcept",
    "pattern": "noexcept",
    "definition": "noexcept declares that an operation must not let an exception escape. If one escapes anyway, the program terminates. This is a promise to callers and containers, not an instruction to ignore failures."
  },
  {
    "id": "virtual",
    "pattern": "\\bvirtual\\b",
    "definition": "A virtual member function allows a call through a base-type reference or pointer to select a derived object’s implementation. Base and derived are types in an inheritance relationship; override marks a derived implementation that must match a virtual function."
  },
  {
    "id": "variant",
    "pattern": "std::variant",
    "definition": "std::variant<A, B> stores one active alternative from its listed types, together with information about which one is active. std::visit calls a handler for that active value; the handler must be valid for every listed alternative."
  },
  {
    "id": "complexity",
    "pattern": "O\\(",
    "definition": "O(n) describes how an operation count grows as an input size n grows, rather than a number of milliseconds. O(log n) describes logarithmic growth; the counted work and input assumptions must be stated."
  },
  {
    "id": "recursion",
    "pattern": "recurs",
    "definition": "Recursion is a function solving a problem by calling itself on a smaller or simpler problem. A base case stops the calls, and a progress measure explains why repeated calls reach it."
  },
  {
    "id": "hash",
    "pattern": "\\bhash",
    "definition": "A hash function maps a key to a numeric code used to choose a search bucket or starting slot. Different keys may share a hash; checking actual key equality distinguishes them. Equivalent keys must have equal hashes."
  },
  {
    "id": "heap",
    "pattern": "\\bheap\\b",
    "definition": "A heap data structure orders each parent relative to its children so a highest- or lowest-priority element is quickly available. This is different from “heap memory,” an informal name for dynamically allocated storage."
  },
  {
    "id": "graph",
    "pattern": "\\bgraph",
    "definition": "A graph represents vertices and connections called edges. An adjacency list records each vertex’s neighbors; directed edges have a direction, while an undirected connection can be followed both ways."
  },
  {
    "id": "bytes",
    "pattern": "\\bbyte",
    "definition": "A byte is a unit of stored data. The course’s file formats use octets, exactly eight bits each; a bit is a binary digit, zero or one. A format must specify how numbers and text turn into those byte values."
  },
  {
    "id": "codec",
    "pattern": "\\bcodec",
    "definition": "A codec defines how values become a sequence of bytes and how those bytes are checked and converted back into values. Encoding writes a specified representation; decoding must reject representations that do not meet that specification."
  },
  {
    "id": "endianness",
    "pattern": "endian",
    "definition": "Endianness describes which byte of a multi-byte number comes first. A portable format chooses an order explicitly rather than copying the host machine’s in-memory representation and assuming all machines agree."
  },
  {
    "id": "ast",
    "pattern": "\\bAST\\b",
    "definition": "An abstract syntax tree, or AST, is a structured representation of recognized source text. For a query, it can store requested columns and a condition separately from the original characters; parsing builds it before execution uses it."
  },
  {
    "id": "transaction",
    "pattern": "transaction",
    "definition": "A transaction groups tentative operations into one change with an explicit commit or rollback. Commit attempts to publish the change; rollback abandons it. Exactly what isolation and durability are promised depends on the model being taught."
  },
  {
    "id": "wal",
    "pattern": "\\bWAL\\b",
    "definition": "A write-ahead log, abbreviated WAL, records recovery information before the associated change is treated as durably published. These lessons use a small redo-log model: replay re-applies validated committed changes after an interruption."
  },
  {
    "id": "revision",
    "pattern": "revision",
    "definition": "A revision is a version number used to identify a particular state. Comparing the revision read earlier with the current one can detect that someone has changed the state in the meantime; the comparison and publication must obey the model’s synchronization rules."
  },
  {
    "id": "thread",
    "pattern": "\\bthread",
    "definition": "A thread is a separate sequence of execution within a program. Threads can access shared objects, so code must coordinate conflicting accesses and ensure objects remain alive until all their users have finished."
  },
  {
    "id": "data-race",
    "pattern": "data race",
    "definition": "A data race occurs when threads perform conflicting accesses to the same memory without the required coordination, with at least one access being a write and without the appropriate atomic protection. In C++, a data race makes the program’s behavior undefined."
  },
  {
    "id": "mutex",
    "pattern": "\\bmutex",
    "definition": "A mutex is a lock used to let only one participating thread enter a protected region at a time. Every access covered by that protection rule must follow it; locking one access does not protect unrelated uncoordinated accesses."
  },
  {
    "id": "atomic",
    "pattern": "\\batomic",
    "definition": "An atomic operation is an indivisible access to an atomic object. It prevents certain torn or conflicting accesses to that object, but does not automatically protect surrounding ordinary data or a multi-step invariant."
  },
  {
    "id": "happens-before",
    "pattern": "happens.before",
    "definition": "Happens-before is the C++ ordering relation that lets one operation’s effects be relied on by another. The concurrency lessons construct specific synchronization edges; wall-clock timing or a convenient observed output is not a substitute for those edges."
  },
  {
    "id": "condition-variable",
    "pattern": "condition.variable",
    "definition": "A condition variable lets a thread wait until shared state may satisfy a condition. The waiting code checks that condition while following its mutex rule; a notification is a prompt to check again, not a stored guarantee that the condition is true."
  },
  {
    "id": "future",
    "pattern": "std::future",
    "definition": "A future is a handle to a result that may become ready later. get() waits for readiness and obtains a value or reports the stored exception. An ordinary future supports one retrieval; shared_future supports repeated observation of its shared result state."
  },
  {
    "id": "mvcc",
    "pattern": "\\bMVCC\\b",
    "definition": "Multi-version concurrency control, or MVCC, keeps multiple versions so a reader can use the version selected by its snapshot. A snapshot identifies the reader’s view; old versions cannot be reclaimed while a reader still needs them."
  },
  {
    "id": "join",
    "pattern": "\\bjoin\\b",
    "definition": "A relational join combines matching rows from two inputs according to a key or condition. This is different from joining a thread, which waits for that thread to finish. Duplicate key matches can produce multiple result rows."
  },
  {
    "id": "checkpoint",
    "pattern": "checkpoint",
    "definition": "A checkpoint records a selected committed state so recovery may start from that state instead of replaying all older work. Which writes are durable and which log records can be discarded depend on the checkpoint protocol."
  },
  {
    "id": "size-types",
    "pattern": "std::(size_t|ptrdiff_t)",
    "definition": "std::size_t is the unsigned whole-number type used for sizes and element counts. std::ptrdiff_t is a signed type used for differences between positions. A size count does not by itself prove that an index is valid."
  },
  {
    "id": "subscript",
    "pattern": "\\w+\\[\\w+\\]",
    "definition": "The expression sequence[i] selects the element at index i. For the ordinary arrays and vectors here, the program must check that i is within the existing elements; the square brackets do not perform that check for you."
  },
  {
    "id": "checked-access",
    "pattern": "\\.at\\(",
    "definition": "at(i) asks a container for the element at index i and reports an out-of-range index by throwing an exception. front() and back() instead access the first and last elements and require the container not to be empty."
  },
  {
    "id": "modulo",
    "pattern": "\\s%\\s",
    "definition": "The % operator computes the remainder of whole-number division. A remainder of zero in value % 2 identifies an even number. Division or remainder with a zero divisor is not permitted."
  },
  {
    "id": "switch",
    "pattern": "\\bswitch\\s*\\(",
    "definition": "switch chooses a case from one controlling value. A case label names a matching value; break exits the switch so execution does not continue into the next case. default handles values without another matching case."
  },
  {
    "id": "null-pointer",
    "pattern": "\\bnullptr\\b",
    "definition": "nullptr is the C++ spelling for a pointer with no target. It is not a valid object to read or write through. Check a possibly empty pointer before using * or -> to access its target."
  },
  {
    "id": "arrow-access",
    "pattern": "->",
    "definition": "pointer->member accesses a member of the object reached through pointer. It is shorthand for (*pointer).member, so the target must exist and be valid for that access."
  },
  {
    "id": "explicit",
    "pattern": "\\bexplicit\\b",
    "definition": "explicit on a constructor prevents that constructor from silently converting an argument during certain implicit conversions. Callers must write the intended construction directly, making a type change visible."
  },
  {
    "id": "member-initialization",
    "pattern": ":\\s*[a-zA-Z_]\\w*\\(",
    "definition": "A constructor’s member-initializer list, after the colon, gives members their starting values before the constructor body runs. Members initialize in declaration order, not in the order written in that list."
  },
  {
    "id": "type-alias",
    "pattern": "\\busing\\s+\\w+\\s*=",
    "definition": "A declaration such as using Count = int; gives an existing type another name. It does not create a distinct type with different checking rules; use a separate user-defined type when that distinction matters."
  },
  {
    "id": "static-member",
    "pattern": "\\bstatic\\s+(int|bool|void|constexpr|std::)",
    "definition": "static has different meanings by context. A static data member belongs to the type rather than each object; a static local keeps its value between calls; static on a namespace-level helper limits its visibility to that translation unit."
  },
  {
    "id": "constexpr",
    "pattern": "\\bconstexpr\\b",
    "definition": "constexpr permits suitable expressions or function calls to be evaluated while compiling. A constexpr variable needs a compile-time value. A constexpr function may also run normally at runtime; constexpr does not force every call to be a compile-time call."
  },
  {
    "id": "static-assert",
    "pattern": "static_assert",
    "definition": "static_assert checks a true/false condition during compilation and rejects the program if it is false. This differs from an ordinary runtime check performed when the finished program executes."
  },
  {
    "id": "decltype",
    "pattern": "\\bdecltype\\b",
    "definition": "decltype(expression) names the type determined by an expression without running that expression. Generic code uses it to describe or inspect types; it is not a runtime conversion of a value."
  },
  {
    "id": "requires",
    "pattern": "\\brequires\\s*[({]",
    "definition": "A requires expression checks whether specified operations are valid for a type. A concept gives such requirements a name. These checks establish available syntax and types, not mathematical laws, safety for every input, or performance guarantees."
  },
  {
    "id": "forwarding",
    "pattern": "std::forward",
    "definition": "std::forward<T>(value) preserves the caller’s value category in a correctly deduced forwarding-reference parameter. T&& in that special template context can accept lvalues and rvalues; ordinary && declarations do not all have that behavior."
  },
  {
    "id": "value-category",
    "pattern": "\\b[lr]value",
    "definition": "An lvalue expression identifies an object that can be referred to again, such as a named variable. An rvalue is a temporary or an expression eligible for value-consuming operations. These categories guide overload selection and moving; they do not say whether an object is const."
  },
  {
    "id": "algorithm-predicate",
    "pattern": "predicate",
    "definition": "A predicate is a callable that answers a true/false question about its input. Algorithms use predicates to decide which elements to keep, find, or group; a comparator instead asks whether one value comes before another."
  },
  {
    "id": "strict-order",
    "pattern": "strict weak order",
    "definition": "A strict weak ordering is a comparison relation suitable for sorting: no value comes before itself, ordering is transitive, and the induced equivalence groups are consistent. A comparator using <= breaks the first requirement."
  },
  {
    "id": "error-code",
    "pattern": "std::errc",
    "definition": "An error code reports a failure as a value rather than by throwing. std::errc names standard error conditions; callers must check both success and any additional result, such as where a parse stopped."
  },
  {
    "id": "assert-runtime",
    "pattern": "\\bassert\\s*\\(",
    "definition": "assert(condition) is a debugging check that stops the program when its condition is false in an assertion-enabled build. It may be disabled in other builds, so it must not be the only validation for untrusted input."
  },
  {
    "id": "cast-reinterpret",
    "pattern": "reinterpret_cast",
    "definition": "reinterpret_cast changes how a pointer or other supported representation is treated at the type level. It does not create an object of the target type or make an otherwise invalid access safe; lifetime, alignment, and access rules still apply."
  },
  {
    "id": "alignment",
    "pattern": "align",
    "definition": "Alignment is a restriction on the storage positions where a type’s objects may be placed. A block with enough bytes can still be unsuitable if its starting position does not meet that restriction."
  },
  {
    "id": "allocator",
    "pattern": "allocat",
    "definition": "Allocation obtains storage in which objects can live. Constructing an object establishes its value in suitable storage; releasing storage and ending an object’s lifetime are related but distinct operations. Library owners usually arrange these steps for you."
  },
  {
    "id": "serializable",
    "pattern": "serializab",
    "definition": "In database isolation, serializable means the accepted transactions behave like some non-overlapping ordering of those transactions. In file formats, serialization instead means converting values to bytes. The surrounding lesson determines which meaning is intended."
  },
  {
    "id": "idempotent",
    "pattern": "idempoten",
    "definition": "An operation is idempotent when applying it again has the same relevant effect as applying it once. Recovery protocols may need this property when replay can repeat an already applied record."
  },
  {
    "id": "linearization",
    "pattern": "lineariz",
    "definition": "A linearization point is the single point at which a concurrent operation is treated as taking effect between its call and return. Identifying one requires an argument about the whole protocol, not merely choosing an atomic instruction."
  },
  {
    "id": "raii",
    "pattern": "RAII",
    "definition": "RAII abbreviates Resource Acquisition Is Initialization: an owner obtains a resource while being created and releases it when its lifetime ends. This ties cleanup to object lifetime rather than requiring a separate manual cleanup instruction on every exit path."
  },
  {
    "id": "output-buffer",
    "pattern": "flush",
    "definition": "Flushing passes pending changes from one buffered layer to the next, such as writing dirty cached bytes through a file interface. It does not by itself prove that those bytes reached durable physical storage; each host interface must specify what completion guarantees."
  },
  {
    "id": "unicode",
    "pattern": "UTF-8",
    "definition": "Unicode assigns code points to characters. UTF-8 encodes a code point using one to four bytes. A byte count, a code-point count, and the number of symbols a person sees can therefore differ; indexing bytes is not a general way to select visible characters."
  },
  {
    "id": "type-erasure",
    "pattern": "type erasure",
    "definition": "Type erasure lets an interface store or use values of different concrete types behind one shared interface. The concrete type still exists; some of its details are hidden from the caller. The chosen wrapper determines copying, allocation and call requirements."
  },
  {
    "id": "perfect-forwarding",
    "pattern": "perfect forwarding",
    "definition": "Perfect forwarding is the generic-code technique of preserving an argument’s type and value category when passing it to another operation. It does not mean the operation is free of copies in every context or safe to forward the same consumable argument repeatedly."
  },
  {
    "id": "release-acquire",
    "pattern": "release.*acquire",
    "definition": "A release operation can publish effects that occurred before it. An acquire operation that observes the corresponding publication establishes the required visibility for those effects. A flag with unrelated or relaxed accesses does not automatically provide that synchronization."
  },
  {
    "id": "predicate-wait",
    "pattern": "spurious",
    "definition": "A spurious wakeup is a wait returning even though no notification establishing the desired condition occurred. Check the protected condition again after waking; the predicate form of wait performs that repeated check."
  },
  {
    "id": "abi",
    "pattern": "\\bABI\\b",
    "definition": "An application binary interface, or ABI, specifies implementation-level agreements such as how compiled functions pass arguments and how certain objects are laid out. It is distinct from the source-language rules and can differ across compiler or platform choices."
  },
  {
    "id": "fixed-width-integers",
    "pattern": "std::(?:u?int(?:8|16|32|64)_t)",
    "definition": "The <cstdint> names describe fixed-width integer types when the implementation provides them. For example, std::uint32_t is an unsigned integer with exactly 32 bits, and std::int32_t is signed with that width. The width describes representation, not whether a value is valid for a particular ID or score."
  },
  {
    "id": "ordered-map",
    "pattern": "std::map",
    "definition": "std::map<Key, Value> associates each unique key with a stored value and keeps keys in comparison order. Lookup searches by key rather than numeric position. The two types in angle brackets specify the key type and mapped-value type."
  },
  {
    "id": "ordered-set",
    "pattern": "std::set",
    "definition": "std::set<T> stores unique T values in comparison order. Inserting an already present equivalent value does not add another element. Equality for uniqueness is determined by the ordering relation, not necessarily by operator==."
  },
  {
    "id": "pair",
    "pattern": "std::pair",
    "definition": "std::pair<A, B> groups two values, whose members are named first and second. The types can differ. A structured binding can give those components local names, but the API still needs to explain what each component means."
  },
  {
    "id": "tuple",
    "pattern": "std::tuple",
    "definition": "std::tuple<A, B, ...> groups values with possibly different types by position. std::get<I> selects position I, counting from zero. A tuple of references borrows its referenced objects rather than extending their lifetimes."
  },
  {
    "id": "default-delete",
    "pattern": "=\\s*(default|delete)",
    "definition": "On a special member function, = default requests the compiler-provided implementation when one is available. = delete forbids using that operation. For example, deleting a copy constructor prevents callers from copying that type through it."
  },
  {
    "id": "operator-overload",
    "pattern": "operator\\s*[=+<\\[]",
    "definition": "A user-defined operator function gives an existing C++ symbol behavior for a user-defined type. For example, operator== defines an equality comparison for values of that type. The definition should preserve the expectations callers have for that operation."
  },
  {
    "id": "type-traits",
    "pattern": "std::(?:is_|decay_t)",
    "definition": "A type trait describes a property of a type at compile time. Names ending in _v commonly expose a true/false result; names ending in _t commonly name a resulting type. For example, is_same_v<A, B> asks whether A and B are the same type."
  },
  {
    "id": "complexity-amortized",
    "pattern": "amortiz",
    "definition": "An amortized cost spreads total work across a sequence of operations, including occasional expensive ones. It differs from a worst-case bound for every individual operation and from a probability-based average over inputs."
  },
  {
    "id": "compound-assignment",
    "pattern": "\\+=",
    "definition": "The expression x += y combines y with the current value of x and stores the result back in x. For the integers here it adds numbers; for a string it appends text. This operation changes x rather than merely producing a separate result."
  },
  {
    "id": "character-literal",
    "pattern": "'\\\\n'",
    "definition": "Single quotes denote one character, while double quotes denote a text literal. In either kind of quotes, the source spelling \\n denotes a line-break character. The different types matter when selecting which operation a function or operator performs."
  }
];
