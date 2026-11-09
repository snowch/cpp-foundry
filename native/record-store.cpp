// CPF1 teaching record store. Build: c++ -std=c++20 -Wall -Wextra -Werror record-store.cpp -o record-store
#include <array>
#include <cerrno>
#include <charconv>
#include <climits>
#include <cstdint>
#include <cstdio>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <map>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>

static_assert(CHAR_BIT == 8);
static_assert(std::numeric_limits<std::uint32_t>::digits == 32);
struct Row { std::string name; std::uint32_t score; };
using Table = std::map<std::uint32_t,Row>;
constexpr std::size_t max_rows = 1000;
constexpr const char* filename = "people.cpf";

bool valid_name(std::string_view text) {
    if (text.empty() || text.size() > 63) return false;
    for (std::size_t i=0;i<text.size();) {
        unsigned first=static_cast<unsigned char>(text[i++]);
        if (first < 0x20 || first == 0x7f) return false;
        if (first < 0x80) continue;
        unsigned continuation=0, value=0, minimum=0;
        if (first>=0xc2 && first<=0xdf) {continuation=1;value=first&31u;minimum=0x80;}
        else if (first>=0xe0 && first<=0xef) {continuation=2;value=first&15u;minimum=0x800;}
        else if (first>=0xf0 && first<=0xf4) {continuation=3;value=first&7u;minimum=0x10000;}
        else return false;
        if (continuation > text.size()-i) return false;
        while (continuation-- != 0) {
            unsigned byte=static_cast<unsigned char>(text[i++]);
            if ((byte&0xc0u)!=0x80u) return false;
            value=(value<<6)|(byte&63u);
        }
        if (value<minimum || value>0x10ffff || (value>=0xd800 && value<=0xdfff)) return false;
        if (value>=0x80 && value<=0x9f) return false;
    }
    return true;
}

std::uint32_t number(std::string_view text) {
    std::uint32_t value=0;
    auto [end,error]=std::from_chars(text.data(),text.data()+text.size(),value);
    if (error!=std::errc{} || end!=text.data()+text.size())
        throw std::runtime_error("invalid unsigned integer");
    return value;
}

void put32(std::vector<unsigned char>& bytes,std::uint32_t value) {
    for (unsigned i=0;i<4;++i) bytes.push_back(static_cast<unsigned char>((value>>(i*8))&255u));
}
std::uint32_t get32(const std::vector<unsigned char>& bytes,std::size_t& at) {
    if (at>bytes.size() || bytes.size()-at<4) throw std::runtime_error("truncated CPF1 field");
    std::uint32_t value=0;
    for (unsigned i=0;i<4;++i) value |= std::uint32_t(bytes[at++])<<(i*8);
    return value;
}

std::vector<unsigned char> encode(const Table& rows) {
    std::vector<unsigned char> bytes{'C','P','F','1'};
    put32(bytes,static_cast<std::uint32_t>(rows.size()));
    for (const auto& [id,row]:rows) {
        put32(bytes,id);put32(bytes,row.score);
        bytes.push_back(static_cast<unsigned char>(row.name.size()));
        for (unsigned char byte:row.name) bytes.push_back(byte);
    }
    return bytes;
}
Table decode(const std::vector<unsigned char>& bytes) {
    if (bytes.size()<8 || bytes[0]!='C' || bytes[1]!='P' || bytes[2]!='F' || bytes[3]!='1')
        throw std::runtime_error("invalid CPF1 magic or header");
    std::size_t at=4;
    auto count=get32(bytes,at);
    if (count>max_rows) throw std::runtime_error("CPF1 row limit exceeded");
    Table candidate;
    for (std::uint32_t i=0;i<count;++i) {
        auto id=get32(bytes,at),score=get32(bytes,at);
        if (at==bytes.size()) throw std::runtime_error("truncated CPF1 name length");
        auto length=bytes[at++];
        if (length>bytes.size()-at) throw std::runtime_error("truncated CPF1 name");
        std::string name(bytes.begin()+static_cast<std::ptrdiff_t>(at),
                         bytes.begin()+static_cast<std::ptrdiff_t>(at+length));
        at+=length;
        if (id==0 || score>100 || !valid_name(name)) throw std::runtime_error("invalid CPF1 row");
        if (!candidate.try_emplace(id,Row{name,score}).second) throw std::runtime_error("duplicate CPF1 ID");
    }
    if (at!=bytes.size()) throw std::runtime_error("trailing CPF1 bytes");
    return candidate;
}

bool load(Table& rows,bool allow_missing) {
    errno=0;
    std::ifstream input(filename,std::ios::binary);
    if (!input) {
        if (allow_missing && errno==ENOENT) return false;
        throw std::runtime_error("cannot open people.cpf");
    }
    std::vector<unsigned char> bytes;
    char byte;
    while (input.get(byte)) {
        if (bytes.size()>=1048576) throw std::runtime_error("database exceeds 1 MB");
        bytes.push_back(static_cast<unsigned char>(byte));
    }
    if (!input.eof()) throw std::runtime_error("database read failed");
    Table candidate=decode(bytes);
    rows.swap(candidate);
    return true;
}
void save(const Table& rows) {
    auto bytes=encode(rows);
    {
        std::ofstream output("people.tmp",std::ios::binary|std::ios::trunc);
        if (!output) throw std::runtime_error("cannot open candidate file");
        output.write(reinterpret_cast<const char*>(bytes.data()),static_cast<std::streamsize>(bytes.size()));
        output.close();
        if (!output) throw std::runtime_error("candidate write or close failed");
    }
    if (std::rename("people.tmp",filename)!=0) throw std::runtime_error("snapshot rename failed");
}

void end_of_command(std::istringstream& input) {
    std::string extra;
    if (input>>extra) throw std::runtime_error("unexpected trailing input");
}

int main() {
    Table rows;
    try {load(rows,true);}
    catch (const std::exception& error) {std::cout<<"error: "<<error.what()<<'\n';return 1;}
    std::string line;
    while (std::getline(std::cin,line)) {
        std::istringstream input(line);
        std::string command;
        if (!(input>>command)) continue;
        try {
            if (command=="INSERT" || command=="UPDATE") {
                std::string id_text,name,score_text;
                if (!(input>>id_text)) throw std::runtime_error("expected ID");
                input>>std::ws;
                if (input.peek()!='"' || !(input>>std::quoted(name)>>score_text))
                    throw std::runtime_error("expected ID \"name\" score");
                end_of_command(input);
                auto id=number(id_text),score=number(score_text);
                if (id==0 || score>100 || !valid_name(name)) throw std::runtime_error("invalid row: ID positive, name 1..63 UTF-8 bytes, score 0..100");
                Row candidate{name,score};
                if (command=="INSERT") {
                    if (rows.contains(id)) throw std::runtime_error("duplicate ID");
                    if (rows.size()==max_rows) throw std::runtime_error("row limit reached");
                    rows.emplace(id,std::move(candidate));
                    std::cout<<"inserted "<<id<<'\n';
                } else {
                    auto found=rows.find(id);
                    if (found==rows.end()) throw std::runtime_error("ID not found");
                    found->second.name.swap(candidate.name);
                    found->second.score=candidate.score;
                    std::cout<<"updated "<<id<<'\n';
                }
            } else if (command=="DELETE") {
                std::string id_text;
                if (!(input>>id_text)) throw std::runtime_error("expected ID");
                end_of_command(input);
                auto id=number(id_text);
                if (id==0) throw std::runtime_error("ID must be positive");
                if (!rows.erase(id)) throw std::runtime_error("ID not found");
                std::cout<<"deleted "<<id<<'\n';
            } else if (command=="LIST") {
                end_of_command(input);
                for (const auto& [id,row]:rows) std::cout<<id<<' '<<std::quoted(row.name)<<' '<<row.score<<'\n';
                std::cout<<"rows="<<rows.size()<<'\n';
            } else if (command=="COUNT") {
                end_of_command(input);std::cout<<"rows="<<rows.size()<<'\n';
            } else if (command=="SAVE") {
                end_of_command(input);save(rows);std::cout<<"saved "<<rows.size()<<'\n';
            } else if (command=="LOAD") {
                end_of_command(input);load(rows,false);std::cout<<"loaded "<<rows.size()<<'\n';
            } else if (command=="HELP") {
                end_of_command(input);
                std::cout<<"INSERT id \"name\" score | UPDATE id \"name\" score | DELETE id | LIST | COUNT | SAVE | LOAD\n";
            } else throw std::runtime_error("unknown command (try HELP)");
        } catch (const std::exception& error) {std::cout<<"error: "<<error.what()<<'\n';}
    }
    return 0;
}
