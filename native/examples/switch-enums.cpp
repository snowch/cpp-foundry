#include <iostream>

enum class Command { list, save };

int main() {
    for (Command command : {Command::list, Command::save}) {
        switch (command) {
        case Command::list:
            std::cout << "scan rows\n";
            break;
        case Command::save:
            std::cout << "publish snapshot\n";
            break;
        }
    }
}
