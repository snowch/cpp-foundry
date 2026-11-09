#include <array>
#include <iostream>
#include <map>
#include <optional>
#include <stdexcept>
#include <utility>

struct Cache {
    struct Frame {
        bool used = false, dirty = false;
        unsigned id = 0, pins = 0;
        std::size_t touched = 0;
        std::array<unsigned char, 16> bytes{};
    };
    std::array<Frame, 2> frames{};
    std::map<unsigned, std::array<unsigned char, 16>> disk;
    std::size_t clock = 0, hits = 0, misses = 0;
    struct Guard {
        Cache *cache;
        std::size_t slot;
        Guard(Cache &owner, std::size_t at) : cache(&owner), slot(at) {
        }
        Guard(const Guard &) = delete;
        Guard &operator=(const Guard &) = delete;
        Guard(Guard &&other) noexcept
            : cache(std::exchange(other.cache, nullptr)), slot(other.slot) {
        }
        ~Guard() {
            if (cache)
                --cache->frames[slot].pins;
        }
        unsigned read(std::size_t at) const {
            return cache->frames[slot].bytes.at(at);
        }
        void write(std::size_t at, unsigned char value) {
            auto &frame = cache->frames[slot];
            frame.bytes.at(at) = value;
            frame.dirty = true;
        }
    };
    Guard pin(unsigned id) {
        for (std::size_t i = 0; i < frames.size(); ++i)
            if (frames[i].used && frames[i].id == id) {
                ++hits;
                ++frames[i].pins;
                frames[i].touched = ++clock;
                return Guard(*this, i);
            }
        std::optional<std::size_t> victim;
        for (std::size_t i = 0; i < frames.size(); ++i)
            if (!frames[i].pins && (!victim || !frames[i].used ||
                                    frames[i].touched < frames[*victim].touched))
                victim = i;
        if (!victim)
            throw std::runtime_error("all pages pinned");
        ++misses;
        auto &frame = frames[*victim];
        if (frame.used && frame.dirty)
            disk[frame.id] = frame.bytes;
        auto found = disk.find(id);
        frame = {};
        frame.used = true;
        frame.id = id;
        frame.pins = 1;
        frame.touched = ++clock;
        if (found != disk.end())
            frame.bytes = found->second;
        return Guard(*this, *victim);
    }
};

int main() {
    Cache cache;
    {
        auto page = cache.pin(1);
        page.write(0, 99);
    }
    {
        auto page = cache.pin(2);
    }
    {
        auto page = cache.pin(3);
    }
    auto reopened = cache.pin(1);
    std::cout << "reloaded=" << reopened.read(0) << "\n";
}
