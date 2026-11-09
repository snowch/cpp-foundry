#include <cstdio>
#include <fstream>
#include <iostream>
#include <string>

int main() {
    {std::ofstream old("current.txt");old<<"old";}
    {std::ofstream next("candidate.txt");next<<"new";}
    if(std::rename("candidate.txt","current.txt")!=0)return 1;
    std::ifstream input("current.txt");std::string value;input>>value;
    std::cout<<value<<"\n";return value=="new"?0:1;
}
