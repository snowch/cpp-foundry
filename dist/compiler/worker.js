/* Browser-local C++20 compilation and execution. No server compilation. */
importScripts('shared.js');
const modules = new Map(), assets = new Map();
async function readBuffer(name) {
  if(name==='sysroot.tar') {
    if(!assets.has(name))assets.set(name,loadBuffer(name));
    return assets.get(name);
  }
  return loadBuffer(name);
}
async function loadBuffer(name) {
  const response = await fetch(name + '.gz');
  if (!response.ok) throw Error(`Could not load ${name} (${response.status}). Retry when connected.`);
  return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
function compileStreaming(name) {
  if (!modules.has(name)) modules.set(name, readBuffer(name).then(bytes => WebAssembly.compile(bytes)));
  return modules.get(name);
}
let busy = false;
self.onmessage = async ({data}) => {
  if (busy) return;
  busy = true;
  let phase = 'loading', output = '', diagnostics = '', count = 0;
  const timings = {}, started = performance.now();
  const stage = name => {phase = name; postMessage({type:'stage',stage:name});};
  try {
    if (typeof data.code !== 'string' || new TextEncoder().encode(data.code).length > 262144)
      throw Error('Source is limited to 256 KB.');
    if (typeof (data.input || '') !== 'string' || new TextEncoder().encode(data.input || '').length > 65536)
      throw Error('Input is limited to 64 KB.');
    const api = new API({readBuffer, compileStreaming, clangResourceInclude:'/lib/clang/23/include',
      clangExtraArgs:['-internal-isystem','/include/wasm32-wasip1'],
      hostWrite(text) {
        text = text.replace(/\x1b\[[0-9;]*m/g,''); count += new TextEncoder().encode(text).length;
        if (count > 100000) throw Error('Output limit reached (100 KB). Check your loop.');
        if (phase === 'running') output += text; else if (phase !== 'loading') diagnostics += text;
      }});
    api.hostLog = () => {};
    api.hostLogAsync = async (_label,promise) => promise;
    stage('loading');
    await Promise.all([api.ready,compileStreaming('clang'),compileStreaming('lld')]);
    timings.load = performance.now() - started;
    api.memfs.addFile('main.cpp', data.code);
    if (data.database) {
      const bytes = new Uint8Array(data.database);
      if (bytes.length > 1048576) throw Error('Database is limited to 1 MB.');
      api.memfs.addFile('people.cpf',bytes);
    }
    stage('compiling'); let at = performance.now();
    await api.run(await compileStreaming('clang'),'clang','-cc1','-emit-obj',...api.clangCommonArgs,
      '-triple','wasm32-unknown-wasip1','-std=c++20','-O0','-Wall','-Wextra','-Werror',
      '-fcxx-exceptions','-fexceptions','-exception-model=wasm','-target-feature','+exception-handling',
      '-mllvm','-wasm-enable-eh','-mllvm','-wasm-use-legacy-eh=false','-o','main.o','-x','c++','main.cpp');
    timings.compile = performance.now() - at;
    stage('linking'); at = performance.now();
    await api.run(await compileStreaming('lld'),'wasm-ld','-Llib/wasm32-wasip1',
      'lib/wasm32-wasip1/crt1.o','main.o','-lc++','-lc++abi','-lunwind','-lc','-lclang_rt.builtins',
      '--strip-all','-z','stack-size=1048576','-o','main.wasm');
    timings.link = performance.now() - at;
    const bytes = api.memfs.getFileContents('main.wasm').slice();
    api.memfs.setStdinStr(data.input || '');
    stage('running'); at = performance.now(); let exitCode = 0;
    try {await api.run(await WebAssembly.compile(bytes),'main.wasm');}
    catch(error) {if(Number.isInteger(error.code)) exitCode = error.code; else throw error;}
    timings.run = performance.now() - at;
    let database = null;
    if (data.persistent && exitCode === 0) {
      // Only the capstone's documented file enters persistent browser storage.
      try {database = api.memfs.getFileContents('people.cpf').slice();} catch {}
      if (database && database.length > 1048576) throw Error('Database exceeded 1 MB. Previous saved data was retained.');
    }
    postMessage({type:'done',output:output.trim(),diagnostics:diagnostics.trim(),exitCode,timings,
      wasmBytes:bytes.length,database});
  } catch(error) {
    postMessage({type:'error',phase,message:error.message,output:output.trim(),diagnostics:diagnostics.trim()});
  } finally {busy=false;}
};
