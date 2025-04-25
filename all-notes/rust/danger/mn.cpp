#include <iostream>

int main() {
    {
        int* c = new int;
        *c = 40;
        std::cout << "Value of c is: " << *c << std::endl; 
        delete c;
    }
    return 0;
}
