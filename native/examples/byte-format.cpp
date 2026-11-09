#include <array>
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
}
