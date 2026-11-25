# Text conversion, formatting, and stream state

Check complete parses, preserve stream state, and choose formatting facilities deliberately.

## Require complete numeric consumption

Before this chapter: [Choose callable storage and captured state](../library-values/README.md)

Parsing turns characters into a value after checking their spelling. Formatting turns a value into characters for presentation. A stream has state flags that remember success or failure; clearing a flag and removing invalid input are different steps.

from_chars reports both an error code and a stopping pointer. A successful prefix parse is not necessarily a valid complete field. It avoids locale-dependent stream extraction, but its accepted syntax differs from convenience conversion functions, including whitespace handling.

[Open figure: A successful prefix is not a complete field](../../diagrams/lib-charconv-complete.html)

Why is 42 accepted but 42x rejected?

Why is 42 accepted but 42x rejected? Field; Conversion result; Whole field accepted?. 42; No error; end reaches position 2; Yes; 42x; Numeric prefix 42; end stops at x; No: suffix remains; 99999999999999999999; Out of int range; No: error code is set. . . Acceptance requires both a clear error code and a stopping pointer at the field end. No conversion and an out-of-range result are distinct failures.

Acceptance requires both a clear error code and a stopping pointer at the field end. No conversion and an out-of-range result are distinct failures.

```cpp
#include <charconv>
#include <iostream>
#include <string_view>
#include <system_error>

int main() {
  for (std::string_view text : {"42", "42x", "99999999999999999999"}) {
    int n = 0;
    auto [end, ec] = std::from_chars(text.data(), text.data() + text.size(), n);
    std::cout << (ec == std::errc{} && end == text.data() + text.size()) << " ";
  }
}

```

Original program output:

```text
1 0 0 
```

42 consumes the full input. 42x leaves trailing text, and the final value is outside the range of int.

Pitfall: Checking only ec accepts trailing junk. On a failed conversion, do not consume the result as if a valid value were produced.

Question: Which statement correctly describes this example’s contract?

1. A successful prefix guarantees valid input
2. Success requires both a clear error code and full consumption
3. from_chars always skips leading whitespace

Answer: 2. Success requires both a clear error code and full consumption. 42 consumes the full input. 42x leaves trailing text, and the final value is outside the range of int.

### Run the starter, then try a change

Open `native/examples/lib-charconv-complete.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-charconv-complete.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
{"42", "42x", "99999999999999999999"}
```

With

```cpp
{" 42", "+42", "-42"}
```

Rerun the terminal command. Compare the three complete-parse flags. Which sign and whitespace spellings does from_chars accept in this case?

## Recover deliberately after failed extraction

Before this chapter: [Choose callable storage and captured state](../library-values/README.md)

New terms and notation:

std::numeric_limits<T> describes limits of a numeric type T. For whole-number types, min() and max() give the smallest and largest representable values; use those limits before arithmetic or conversion can exceed them.

Formatted extraction records failures in stream state. Once failbit is set, later extraction normally does no work until state is cleared. Clearing flags does not remove the offending characters; recovery must also establish a new input boundary.

```cpp
#include <iostream>
#include <limits>
#include <sstream>
#include <string>

int main() {
  std::istringstream input("bad\n42\n");
  int value = 0;
  input >> value;
  std::cout << input.fail() << " ";
  input.clear();
  input.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
  input >> value;
  std::cout << value;
}

```

Original program output:

```text
1 42
```

The code clears the error and discards the bad line before reading 42 from the next line.

Pitfall: Calling clear alone can retry the same invalid characters forever. Mixing getline and formatted extraction also requires accounting for a pending newline.

Question: Which statement correctly describes this example’s contract?

1. clear discards the entire bad line
2. A failed stream automatically retries on the next line
3. Recovery needs both state repair and input-position repair

Answer: 3. Recovery needs both state repair and input-position repair. The code clears the error and discards the bad line before reading 42 from the next line.

### Run the starter, then try a change

Open `native/examples/lib-stream-state.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-stream-state.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
bad\n42\n
```

With

```cpp
12oops\n42\n
```

Rerun the terminal command. Compare the failure flag and the last value. Does successful extraction of a numeric prefix imply that the whole line is numeric?

## Control numeric presentation without changing values

Before this chapter: [Choose callable storage and captured state](../library-values/README.md)

Stream manipulators affect presentation state. fixed and setprecision persist for later floating-point insertions, while setw normally applies to the next formatted field. Formatting is not a binary serialization format, and locale can change the textual conventions.

```cpp
#include <iomanip>
#include <iostream>
#include <sstream>

int main() {
  std::ostringstream out;
  out << std::fixed << std::setprecision(2) << 1.25 << " " << 2.0;
  std::cout << out.str();
}

```

Original program output:

```text
1.25 2.00
```

The same persistent precision produces two digits after the decimal point for both values.

Pitfall: Do not assume precision means fractional digits under the default floating format; it normally controls significant digits instead.

Question: Which statement correctly describes this example’s contract?

1. setprecision rounds the stored floating value permanently
2. All stream manipulators affect only one insertion
3. fixed makes precision count fractional digits

Answer: 3. fixed makes precision count fractional digits. The same persistent precision produces two digits after the decimal point for both values.

### Run the starter, then try a change

Open `native/examples/lib-format-streams.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-format-streams.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
std::setprecision(2)
```

With

```cpp
std::setprecision(1)
```

Rerun the terminal command. Compare both printed values. Does the number of digits after the decimal point change?

## Use C++20 format with an explicit support boundary

Before this chapter: [Choose callable storage and captured state](../library-values/README.md)

New terms and notation:

Alignment is a restriction on the storage positions where a type’s objects may be placed. A block with enough bytes can still be unsuitable if its starting position does not meet that restriction.

std::format provides typed replacement fields and returns an owning string. Format specifications belong to the selected argument’s formatter, so syntax valid for integers may not be valid for arbitrary user types. C++20 language mode alone does not establish library feature availability.

```cpp
#include <format>
#include <iostream>
#include <string>

int main() {
  std::string text = std::format("id={:04d} score={:.1f}", 7, 2.5);
  std::cout << text;
}

```

Original program output:

```text
id=0007 score=2.5
```

The integer field receives zero padding to width four, and the floating field uses one fractional digit.

Pitfall: The browser toolchain and the native standard library may implement different format subsets. Detect the library feature and test the exact formats used by the application.

Question: Which statement correctly describes this example’s contract?

1. Enabling C++20 guarantees every format implementation is complete
2. Library support must be checked independently of the language mode
3. std::format modifies each argument in place

Answer: 2. Library support must be checked independently of the language mode. The integer field receives zero padding to width four, and the floating field uses one fractional digit.

### Run the starter, then try a change

Open `native/examples/lib-format-feature.cpp` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.

```sh
run_dir=$(mktemp -d) && g++ -std=c++20 -Wall -Wextra -Werror native/examples/lib-format-feature.cpp -o "$run_dir/example" && (cd "$run_dir" && ./example)
```

Replace

```cpp
id={:04d} score={:.1f}
```

With

```cpp
id={:06d} score={:.2f}
```

Rerun the terminal command. Compare the ID padding and the number of fraction digits in score. Which part of the format string controls each?

## Chapter project

Build a strict text import with separate syntax and range errors.
