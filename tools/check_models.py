"""Independent mixed-operation oracles for the course's bounded teaching models."""
import os
import subprocess
import tempfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]
cases={
'hash-buckets':r'''
int main() {
    Hash<7> table;
    std::map<unsigned,int> model;
    std::mt19937 random(17);
    for(unsigned step=0;step<4000;++step) {
        unsigned key=random()%49,operation=random()%3;
        if(operation==0) {
            bool expected=!model.contains(key)&&model.size()<7;
            if(table.put(key,int(key*10))!=expected)return 1;
            if(expected)model.emplace(key,int(key*10));
        } else if(operation==1) {
            bool expected=model.erase(key)!=0;
            if(table.erase(key)!=expected)return 2;
        }
        for(unsigned candidate=0;candidate<49;++candidate) {
            auto actual=table.get(candidate);auto expected=model.find(candidate);
            if(bool(actual)!=(expected!=model.end()))return 3;
            if(actual&&*actual!=expected->second)return 4;
        }
    }
    std::cout<<"4000 hash operations verified\n";
}
''',
'avl-delete-oracle':r'''
int main() {
    Tree tree;std::set<int> model;std::mt19937 random(23);
    for(unsigned step=0;step<4000;++step) {
        int key=int(random()%128);
        if(random()%2){insert(tree,key);model.insert(key);}
        else {erase(tree,key);model.erase(key);}
        std::vector<int> actual;ordered(tree,actual);
        const std::vector<int> expected(model.begin(),model.end());
        if(actual!=expected||!heights_valid(tree))return 1;
        for(int candidate=0;candidate<128;++candidate)
            if(contains(tree,candidate)!=model.contains(candidate))return 2;
    }
    std::cout<<"4000 AVL operations verified\n";
}
''',
'bplus-reference':r'''
int main() {
    Index tree;std::set<int> model;std::mt19937 random(31);
    for(unsigned step=0;step<4000;++step) {
        int key=int(random()%100);
        if(random()%2) {
            auto before=tree.leaves;bool duplicate=model.contains(key);
            bool accepted=tree.insert(key);
            if(accepted){if(duplicate)return 1;model.insert(key);}
            else {
                if(before!=tree.leaves)return 2;
                if(!duplicate&&(before.size()!=8||before[tree.route(key)].size()!=4))return 3;
            }
        } else {
            bool expected=model.erase(key)!=0;
            if(tree.erase(key)!=expected)return 4;
        }
        const std::vector<int> expected(model.begin(),model.end());
        if(!tree.valid()||tree.range(-1,101)!=expected)return 5;
        for(int candidate=0;candidate<100;++candidate)
            if(tree.contains(candidate)!=model.contains(candidate))return 6;
    }
    std::cout<<"4000 bounded B+ operations verified\n";
}
''',
'heap-reference':r'''
int main() {
    MinHeap heap;std::multiset<int> model;std::mt19937 random(47);
    for(unsigned step=0;step<4000;++step) {
        if(random()%2){int value=int(random()%200)-100;heap.push(value);model.insert(value);}
        else {
            auto value=heap.pop();
            if(bool(value)!=!model.empty())return 1;
            if(value){if(*value!=*model.begin())return 2;model.erase(model.begin());}
        }
        if(!heap.valid())return 3;
        auto actual=heap.values;std::sort(actual.begin(),actual.end());
        const std::vector<int> expected(model.begin(),model.end());
        if(actual!=expected)return 4;
    }
    std::cout<<"4000 heap operations verified\n";
}
''',
'oldest-reader-gc':r'''
int main() {
    Versions versions;std::map<unsigned,std::optional<int>> history{{1,10}};
    std::vector<unsigned> readers;std::mt19937 random(59);
    for(unsigned step=0;step<2000;++step) {
        unsigned operation=random()%4;
        if(operation==0){std::optional<int> value;if(random()%3)value=int(random()%100);versions.write(value);history.emplace(versions.clock,value);}
        else if(operation==1&&readers.size()<20)readers.push_back(versions.snapshot());
        else if(operation==2&&!readers.empty()){auto at=random()%readers.size();versions.release(readers[at]);readers.erase(readers.begin()+at);}
        else versions.collect();
        auto check=[&](unsigned stamp){auto expected=history.upper_bound(stamp);--expected;return versions.read(stamp)==expected->second;};
        if(!check(versions.clock))return 1;
        for(auto stamp:readers)if(!check(stamp))return 2;
    }
    std::cout<<"2000 MVCC operations verified\n";
}
''',
'wal-crash-prefix-oracle':r'''
int main() {
    Bytes log;
    for(unsigned transaction=1;transaction<=30;++transaction){append(log,record('P',static_cast<unsigned char>(transaction),transaction*10));append(log,record('C',static_cast<unsigned char>(transaction),0));}
    for(std::size_t prefix=0;prefix<=log.size();++prefix)
        if(recover(std::span(log).first(prefix)).value!=(prefix/14)*10)return 1;
    for(std::size_t byte=0;byte<log.size();++byte){auto damaged=log;damaged[byte]^=1;if(recover(damaged).valid_bytes>(byte/7)*7)return 2;}
    std::cout<<"421 crash prefixes and 420 single-bit corruptions verified\n";
}
''',
}
with tempfile.TemporaryDirectory() as directory:
    work=Path(directory)
    for lesson,body in cases.items():
        source=(root/'native/examples'/f'{lesson}.cpp').read_text().split('int main()',1)[0]
        source='#include <map>\n#include <random>\n#include <set>\n'+source+body
        path=work/(lesson+'.cpp');path.write_text(source)
        executable=work/lesson
        subprocess.run([os.environ.get('CXX','g++'),'-std=c++20','-Wall','-Wextra','-Werror',str(path),'-o',str(executable)],check=True)
        result=subprocess.run([str(executable)],capture_output=True,text=True,timeout=30)
        if result.returncode:raise RuntimeError(f'{lesson}: oracle failed with exit {result.returncode}\n{result.stderr}')
        print('PASS '+result.stdout.strip(),flush=True)
