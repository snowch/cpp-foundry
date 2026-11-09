"""Prepare pinned C++/Wasm assets for static hosting. Linux x86_64 build host."""
import gzip
import hashlib
import json
import platform
import subprocess
import sys
import tarfile
from pathlib import Path

root=Path(__file__).resolve().parents[1]
cache=root/'.cache/toolchain'
output=root/'dist/compiler'
cache.mkdir(parents=True,exist_ok=True)
output.mkdir(parents=True,exist_ok=True)
if platform.system()!='Linux' or platform.machine() not in ('x86_64','AMD64'):
    raise SystemExit('Prepare assets on Linux x86_64 (Codespaces, the dev container, or GitHub Actions). The deployed site runs in supported browsers on other hosts.')
artifacts={
    'clang22':('https://github.com/cppstudio-io/wasm-clang-runtime/releases/download/v0.1.0/clang22','3f3da7691ecc5d02d7f056ba849eed408fcf494656ad65b5756ba285e59d30a5'),
    'lld22':('https://github.com/cppstudio-io/wasm-clang-runtime/releases/download/v0.1.0/lld22','4d88d4faa2bbe22dfb099bf28d8c5884fb3e90462acca4057dbb96746ce99ac4'),
    'wasi-sdk-34.0-x86_64-linux.tar.gz':('https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-34/wasi-sdk-34.0-x86_64-linux.tar.gz','b761e3a0721dbae9c09a0059e5fdb2bf917d1b4a8a7b430fb3b5aafb0984b2c4'),
}
for name,(url,digest) in artifacts.items():
    file=cache/name
    if not file.exists():
        candidate=file.with_suffix(file.suffix+'.download')
        subprocess.run(['curl','-fL','--retry','3','--max-time','240','--output',str(candidate),url],check=True)
        if hashlib.sha256(candidate.read_bytes()).hexdigest()!=digest:
            raise SystemExit('Downloaded artifact checksum mismatch: '+name)
        candidate.rename(file)
    if hashlib.sha256(file.read_bytes()).hexdigest()!=digest:
        raise SystemExit('Cached artifact checksum mismatch: '+name)
    print('Verified '+name,flush=True)

sdk=cache/'wasi-sdk-34.0-x86_64-linux'
if not sdk.exists():
    with tarfile.open(cache/'wasi-sdk-34.0-x86_64-linux.tar.gz') as archive:
        archive.extractall(cache,filter='data')
compiler=sdk/'bin/clang'
runtime=root/'tools/runtime'
work=root/'.build/toolchain'
work.mkdir(parents=True,exist_ok=True)
subprocess.run([str(compiler),'--target=wasm32-wasip1','-O2','-Wall','-Wextra','-Wno-unused-parameter','-c','memfs.c','-o',str(work/'memfs.o')],cwd=runtime,check=True)
subprocess.run([str(compiler),'--target=wasm32-wasip1','-DSTB_SPRINTF_IMPLEMENTATION','-x','c','-O2','-c','stb_sprintf.h','-o',str(work/'stb_sprintf.o')],cwd=runtime,check=True)
subprocess.run([str(sdk/'bin/wasm-ld'),'-L'+str(sdk/'share/wasi-sysroot/lib/wasm32-wasip1'),'--no-entry','--export-dynamic','--allow-undefined','--initial-memory=4194304','-o',str(work/'memfs'),str(work/'memfs.o'),str(work/'stb_sprintf.o'),'-lc'],check=True)
for source,target in [(cache/'clang22','clang.gz'),(cache/'lld22','lld.gz'),(work/'memfs','memfs.gz')]:
    (output/target).write_bytes(gzip.compress(source.read_bytes(),mtime=0))
subprocess.run([sys.executable,str(root/'tools/pack_toolchain.py'),str(sdk),str(output/'sysroot.tar.gz')],check=True)
manifest={'clang':'22.1.8','wasiSdk':'34.0','runtimeSource':'cppstudio-io/wasm-clang-runtime@df1180d80184733c6a01599f76b92b4001d20f87','assets':{}}
for name in ['clang.gz','lld.gz','memfs.gz','sysroot.tar.gz']:
    data=(output/name).read_bytes()
    manifest['assets'][name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
(output/'toolchain.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Prepared '+str(sum(a['bytes'] for a in manifest['assets'].values()))+' compressed bytes for browser delivery.')
