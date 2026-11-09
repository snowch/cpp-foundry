#include <iostream>
#include <map>
#include <span>
#include <vector>

using Bytes = std::vector<unsigned char>;
Bytes record(unsigned char tag, unsigned char transaction, unsigned value) {
    Bytes bytes{tag, transaction};
    for (unsigned i = 0; i < 4; ++i)
        bytes.push_back(static_cast<unsigned char>((value >> (i * 8)) & 255u));
    unsigned char checksum = 0;
    for (auto byte : bytes)
        checksum ^= byte;
    bytes.push_back(checksum);
    return bytes;
}
void append(Bytes &log, const Bytes &bytes) {
    log.insert(log.end(), bytes.begin(), bytes.end());
}
struct Recovery {
    unsigned value = 0;
    std::size_t valid_bytes = 0;
    bool tail = false;
};
Recovery recover(std::span<const unsigned char> log, unsigned initial = 0) {
    Recovery result{initial, 0, false};
    std::map<unsigned, unsigned> pending;
    while (log.size() - result.valid_bytes >= 7) {
        auto at = result.valid_bytes;
        unsigned char checksum = 0;
        for (unsigned i = 0; i < 6; ++i)
            checksum ^= log[at + i];
        auto tag = log[at], transaction = log[at + 1];
        if (checksum != log[at + 6] || (tag != 'P' && tag != 'C'))
            break;
        unsigned value = 0;
        for (unsigned i = 0; i < 4; ++i)
            value |= unsigned(log[at + 2 + i]) << (i * 8);
        if (tag == 'P')
            pending[transaction] = value;
        else if (auto found = pending.find(transaction); found != pending.end()) {
            result.value = found->second;
            pending.erase(found);
        }
        result.valid_bytes += 7;
    }
    result.tail = result.valid_bytes != log.size();
    return result;
}

int main() {
    Bytes log;
    append(log, record('P', 1, 42));
    auto commit = record('C', 1, 0);
    log.insert(log.end(), commit.begin(), commit.end() - 1);
    auto result = recover(log);
    std::cout << "value=" << result.value << " valid=" << result.valid_bytes
              << " tail=" << result.tail << "\n";
}
