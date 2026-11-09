"""Build the runtime sysroot from the pinned WASI SDK, without host binaries."""
import gzip
import io
import sys
import tarfile
from pathlib import Path

sdk, output = map(Path, sys.argv[1:])
sysroot = sdk / 'share/wasi-sysroot'
files = {}
for path in (sysroot/'include/wasm32-wasip1').rglob('*'):
    relative = path.relative_to(sysroot/'include/wasm32-wasip1')
    if path.is_file() and not set(relative.parts) & {'eh','noeh'}:
        files['include/wasm32-wasip1/'+relative.as_posix()] = path
for path in (sysroot/'include/wasm32-wasip1/eh/c++/v1').rglob('*'):
    if path.is_file():
        files['include/c++/v1/'+path.relative_to(sysroot/'include/wasm32-wasip1/eh/c++/v1').as_posix()] = path
for path in (sdk/'lib/clang/23/include').rglob('*'):
    if path.is_file():
        files['lib/clang/23/include/'+path.relative_to(sdk/'lib/clang/23/include').as_posix()] = path
for name in ['crt1.o','libc.a','libm.a']:
    files['lib/wasm32-wasip1/'+name] = sysroot/'lib/wasm32-wasip1'/name
for name in ['libc++.a','libc++abi.a','libunwind.a']:
    files['lib/wasm32-wasip1/'+name] = sysroot/'lib/wasm32-wasip1/eh'/name
files['lib/wasm32-wasip1/libclang_rt.builtins.a'] = sdk/'lib/clang/23/lib/wasm32-unknown-wasip1/libclang_rt.builtins.a'
directories = set()
buffer = io.BytesIO()
with tarfile.open(fileobj=buffer,mode='w',format=tarfile.USTAR_FORMAT) as archive:
    for name,path in sorted(files.items()):
        for parent in reversed(Path(name).parents):
            directory = parent.as_posix()
            if directory == '.' or directory in directories: continue
            info = tarfile.TarInfo(directory+'/');info.type=tarfile.DIRTYPE;info.mode=0o755
            archive.addfile(info);directories.add(directory)
        contents=path.read_bytes()
        info=tarfile.TarInfo(name);info.size=len(contents);info.mode=0o644
        archive.addfile(info,io.BytesIO(contents))
output.write_bytes(gzip.compress(buffer.getvalue(),mtime=0))
print(f'{len(files)} sysroot files; {output.stat().st_size:,} compressed bytes')
