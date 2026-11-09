import json
import os
import subprocess
import tempfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]
compiler=os.environ.get('CXX','g++')
with tempfile.TemporaryDirectory() as directory:
    work=Path(directory)
    for lesson in json.loads((root/'native/lessons.json').read_text()):
        executable=work/lesson['id']
        subprocess.run([compiler,'-std=c++20','-Wall','-Wextra','-Werror',
                        *lesson['flags'].split(),str(root/'native/examples'/f"{lesson['id']}.cpp"),'-o',str(executable)],check=True)
        actual=subprocess.run([str(executable)],cwd=work,text=True,capture_output=True,check=True,timeout=10).stdout.strip()
        assert actual==lesson['expected'].strip(),(lesson['id'],actual,lesson['expected'])
        print('PASS '+lesson['id'],flush=True)
    executable=work/'record-store'
    subprocess.run([compiler,'-std=c++20','-Wall','-Wextra','-Werror',str(root/'native/record-store.cpp'),'-o',str(executable)],check=True)
    def run(text):
        return subprocess.run([str(executable)],cwd=work,input=text,text=True,capture_output=True,check=True).stdout.strip()
    assert run('INSERT 1 "Ada" 90\nINSERT 2 "Grace" 95\nSAVE\n')=='inserted 1\ninserted 2\nsaved 2'
    saved=(work/'people.cpf').read_bytes()
    # An independently specified little-endian fixture, not the encoder's own output.
    expected=b'CPF1\x02\x00\x00\x00\x01\x00\x00\x00\x5a\x00\x00\x00\x03Ada\x02\x00\x00\x00\x5f\x00\x00\x00\x05Grace'
    assert saved==expected
    assert run('LIST\n')=='1 "Ada" 90\n2 "Grace" 95\nrows=2'
    assert run('INSERT 1 "Wrong" 0\nSAVE\n')=='error: duplicate ID\nsaved 2'
    assert (work/'people.cpf').read_bytes()==saved
    assert run('UPDATE 1 "Ada Lovelace" 99\nDELETE 2\nSAVE\nLIST\n')=='updated 1\ndeleted 2\nsaved 1\n1 "Ada Lovelace" 99\nrows=1'
    assert run('INSERT 3 "Zoë" 80\nSAVE\n').endswith('saved 2')
    assert 'Zoë' in run('LIST\n')
    for damaged in [b'',saved[:-1],saved+b'x',b'BAD!'+saved[4:],b'CPF1\xe9\x03\x00\x00']:
        (work/'people.cpf').write_bytes(damaged)
        rejected=subprocess.run([str(executable)],cwd=work,input='SAVE\n',text=True,capture_output=True)
        assert rejected.returncode==1
        assert (work/'people.cpf').read_bytes()==damaged
    print('PASS capstone exact bytes, persistence, rejection preservation, updates, deletion, UTF-8, and corrupt files',flush=True)
