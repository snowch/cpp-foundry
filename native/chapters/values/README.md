# Values before pointers

Write useful programs with strings, vectors, and small functions.

## A first C++20 program

Start here. No earlier C++ knowledge is required; the lessons introduce the source notation before asking you to change it.

A program is a list of instructions for the computer. C++20 names the language version used in this course. This first program displays a greeting. Click Run code below and look for Hello, Ada! in the output box. You do not need to install anything to run this example.

Read the program from top to bottom. #include <iostream> asks the compiler to use the iostream header: a supplied file that makes text-output tools available. main names the starting group of instructions. int says this group reports a whole-number status when it finishes, and () means this example supplies no inputs to that group. The braces { and } enclose its instructions. A semicolon ; ends each instruction inside the braces.

The prefix std:: identifies a name from the standard library, C++’s supplied collection of reusable tools. std::cout names the destination for normal text output. Think of << here as “send the text on the right to the output.” The double quotes mark literal text: characters to display rather than instructions to execute. Inside that text, \n means start a new line. It is two characters in the source spelling but requests one line break in the output.

Run code first compiles the C++ source: it checks the language rules and translates the instructions into a runnable program. It then runs that program. A compiler diagnostic is a message about a problem in the source; the output box can show these messages as well as the program’s text. The final instruction return 0; ends main and reports successful completion to the environment running the program.

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, Ada!\n";
    return 0;
}

```

Expected output:

```text
Hello, Ada!
```

main contains two instructions. The first sends the greeting and a line break to the output. return 0 ends main and reports success to the environment that started the program. The text you see is Hello, Ada!; the surrounding quotation marks are source notation and are not printed.

Pitfall: Changing the greeting inside its quotes is allowed. Removing a closing quote or a semicolon breaks the source notation and produces a compiler diagnostic. A program can also compile yet print the wrong greeting; always compare the actual output with what you intended.

Question: Which part is the literal text sent to the output?

1. "Hello, Ada!\n"
2. int main()
3. return 0;

Answer: 1. The quoted characters are the greeting. \n requests the line break. main identifies the starting instructions and return 0 reports successful completion.

Experiment: Change only Ada to your own name and run again. Next, remove the semicolon after the output instruction and run. Read the diagnostic, restore the semicolon, and confirm that the greeting runs again.

## Store numbers and calculate a result

A variable gives a name to a stored value. In int apples = 20;, int is the type: it says this variable holds a whole number. apples is the name, and = 20 supplies its starting value. This starting step is called initialization. A later assignment can replace the stored value.

The + operator adds two numbers. The program below stores two counts, adds them, and stores the answer as total. When std::cout receives a variable name without quotation marks, it prints that variable’s value. Quoted text such as "total=" is printed as text instead. Repeating << in one instruction sends successive pieces from left to right; the final quoted line-break sequence starts a new output line.

A type has limits. int can store only a finite range of whole numbers; it is not an unlimited mathematical integer. These small counts are safely within that range. We will learn explicit limit checks later, after functions and decisions are familiar.

```cpp
#include <iostream>

int main() {
    int apples = 20;
    int pears = 22;
    int total = apples + pears;
    std::cout << total << "\n";
    return 0;
}

```

Expected output:

```text
42
```

The first two variables hold 20 and 22. The third instruction adds their values and initializes total to 42. The output instruction prints that number followed by a line break.

Pitfall: "total" and total mean different things: the quoted version is literal text, while the unquoted name refers to the stored number. Do not assume int can hold arbitrarily large counts.

Question: What does std::cout << total print in this example?

1. 42
2. The word total
3. 20

Answer: 1. Using the variable’s name reads its current value, which is 20 + 22, or 42.

Experiment: Change apples to 5 and pears to 8, predict the total, then run. Add the instruction total = total + 1; before printing and explain why the output increases by one.

## Give text a name

A string is a value containing a sequence of characters, such as a person’s name. std::string is the standard-library type used here, made available by #include <string>. The std:: prefix identifies a name supplied by C++’s standard library. Keep the two colons together.

std::string name = "Ada"; creates a variable named name with the text Ada. name = "Grace"; later replaces its value. A quoted literal is fixed text in the source; a string variable gives text a name so it can be read and changed while the program runs. We do not need to manage the storage for these ordinary variables.

Several << operations in one output instruction send several pieces to the same destination, from left to right. In the last instruction below, one piece is quoted text, one is the current value of name, and the last is a line break.

```cpp
#include <iostream>
#include <string>

int main() {
    std::string name = "Ada";
    std::cout << name << "\n";
    name = "Grace";
    std::cout << "Hello, " << name << "!\n";
    return 0;
}

```

Expected output:

```text
Ada
Hello, Grace!
```

The first output uses the starting value Ada. Assignment replaces it with Grace before the second output instruction reads it.

Pitfall: A name such as Name is different from name: C++ distinguishes uppercase and lowercase letters. A quoted "name" prints the word instead of reading the variable.

Question: Which instruction replaces the stored text?

1. name = "Grace";
2. std::cout << name;
3. #include <string>

Answer: 1. name = "Grace";. The first output uses the starting value Ada. Assignment replaces it with Grace before the second output instruction reads it.

Experiment: Change both names, then print name twice before replacing it. Explain which output instructions read the earlier value and which read the later value.

## Choose which instructions run

A condition is a question whose answer is true or false. The comparison score >= 60 asks whether score is at least 60. The >= symbol includes equality. Use > for strictly greater than and == for equal to. bool is the C++ type for these two possible answers.

An if statement runs its first group of instructions when the condition in parentheses is true. An else group runs when that condition is false. Braces keep the instructions for each choice together. Only one of these two groups runs on a single visit to this statement.

```cpp
#include <iostream>

int main() {
    int score = 60;
    if (score >= 60) {
        std::cout << "pass\n";
    } else {
        std::cout << "retry\n";
    }
    return 0;
}

```

Expected output:

```text
pass
```

The comparison is true for 60, so the first output runs. The retry output is skipped.

Pitfall: Use == to ask whether two values are equal. A single = assigns a value; it is not the equality comparison.

Question: Which score makes this condition true?

1. 60
2. 59
3. 0

Answer: 1. 60. The comparison is true for 60, so the first output runs. The retry output is skipped.

Experiment: Try 59, 60, and 61. Predict the chosen message before running each version. Replace >= with > and explain the change at exactly 60.

## Repeat instructions with a while loop

A loop repeats a group of instructions. A while loop checks its condition before every repetition, including the first. When the condition becomes false, execution continues after the loop’s closing brace.

In this example count starts at 1. count <= 3 asks whether it is at most 3. The instruction count = count + 1 replaces it with the next whole number. This change eventually makes the condition false, giving the loop a way to stop.

```cpp
#include <iostream>

int main() {
    int count = 1;
    while (count <= 3) {
        std::cout << count << "\n";
        count = count + 1;
    }
    return 0;
}

```

Expected output:

```text
1
2
3
```

Each repetition prints the current count and then increases it. After printing 3, count becomes 4, and the next condition check ends the loop.

Pitfall: Leaving out the increase would repeat the same value without reaching the stop condition. Use Stop if an experimental program keeps running.

Question: Why does this loop stop?

1. count becomes 4, making count <= 3 false
2. Printing automatically stops after three lines
3. The closing brace stops all repetition

Answer: 1. count becomes 4, making count <= 3 false. Each repetition prints the current count and then increases it. After printing 3, count becomes 4, and the next condition check ends the loop.

Experiment: Change the starting count to 4 and predict whether the body runs at all. Then change the upper bound to 5 and predict the entire output.

## Name a calculation with a function

A function is a named group of instructions. A function call asks the computer to run those instructions. We have already used main as the program’s starting function; now we will write another function and call it from main.

In int twice(int value), the first int says the function produces a whole-number result. twice is its name. The name value inside the parentheses is a parameter: a variable that receives the input for this call. return sends the calculated result back to the place that called the function.

The expression twice(6) calls the function with 6 as its input. The function returns 12, which initializes answer. Multiplication uses * here. Describe a function’s contract in plain terms: this one accepts a small whole number and returns twice that number; very large inputs need range checks that this introductory version does not provide.

```cpp
#include <iostream>

int twice(int value) {
    return value * 2;
}

int main() {
    int answer = twice(6);
    std::cout << answer << "\n";
    return 0;
}

```

Expected output:

```text
12
```

Execution starts in main, not at the first function definition in the file. The call twice(6) runs twice with value equal to 6. Its return instruction supplies 12 to main, which then prints answer.

Pitfall: Defining a function does not run it. Its instructions run when it is called. The parameter is a local input value for that call, not a variable that main can name directly.

Question: Which expression calls the new function?

1. twice(6)
2. int answer
3. return 0;

Answer: 1. Parentheses after the function name supply the call’s input. twice(6) runs the calculation and produces its result.

Experiment: Call twice with 0, 3, and -2, printing each result. Then write an int plus_one(int value) function using return value + 1; and call it from main.

## Keep several values in a vector

A collection groups several values so a program can work with them together. std::vector<int> is a standard-library type for a sequence of whole numbers. The <int> part says what kind of element each position contains. #include <vector> makes this type available.

The braces in std::vector<int> scores{70, 80, 90}; give the starting elements. scores.push_back(100) calls an operation on that vector to append one element. The dot connects the variable to an operation it provides. scores.size() asks how many elements are currently present.

A range-based for loop visits each element. In for (int score : scores), score receives the next element’s value each time through the loop. This differs from the earlier while loop: the vector determines which values to visit, so we do not maintain a counter ourselves.

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<int> scores{70, 80, 90};
    scores.push_back(100);
    for (int score : scores) {
        std::cout << score << "\n";
    }
    std::cout << "count=" << scores.size() << "\n";
    return 0;
}

```

Expected output:

```text
70
80
90
100
count=4
```

The vector starts with three elements and append adds a fourth. The loop prints each value in order. size reports four; it counts elements, not the number of characters used to print them.

Pitfall: The loop’s score is a separate value. Assigning a different number to score does not change the corresponding element in scores. Accessing and changing stored elements is a later lesson.

Question: How many elements are present after push_back(100)?

1. Four
2. Three
3. One hundred

Answer: 1. push_back adds one element to the three starting elements, so the size becomes four.

Experiment: Append another score and predict both the printed sequence and the final count. Then start with std::vector<int> scores{}; and explain why the loop prints no scores before an append.

## Keep local names inside their braces

A block is a group of instructions enclosed in braces. A local variable can be named only within the part of the program where it is visible. That region is its scope. A variable declared inside an inner block is not available after that block ends.

The outer variable below is declared in main. The inner variable is declared between an additional pair of braces. Both can be read inside that inner block, but only outer remains available afterward. Keeping a name’s scope small makes it easier to follow where its value can change.

```cpp
#include <iostream>

int main() {
    int outer = 10;
    {
        int inner = 2;
        std::cout << outer + inner << "\n";
    }
    std::cout << outer << "\n";
    return 0;
}

```

Expected output:

```text
12
10
```

The inner block prints 10 + 2. After its closing brace, the program can still read outer, but the name inner is no longer available.

Pitfall: Using inner after its block ends is a source-code error, even if a previous run happened to display the expected number.

Question: Which name is available in the final output instruction?

1. outer
2. inner
3. Both names

Answer: 1. outer. The inner block prints 10 + 2. After its closing brace, the program can still read outer, but the name inner is no longer available.

Experiment: Try adding std::cout << inner; after the inner block and read the compiler diagnostic. Remove that instruction, then move inner’s declaration into main and explain how its scope changes.

## Chapter project

Build a score summary that handles an empty collection.
