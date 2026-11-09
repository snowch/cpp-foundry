import {read,write} from './storage.js';
export function download(name,bytes,type='application/octet-stream') {
  const url=URL.createObjectURL(new Blob([bytes],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function mountEditor(target,{id,code,input='',persistent=false,getDatabase=()=>null,onResult=async()=>{},notice=()=>{}}) {
  target.innerHTML=`<section class="editor" aria-label="C++ editor" data-busy="false">
    <div class="editor-heading"><span>main.cpp</span><span>C++20 · runs in your browser</span></div>
    <textarea class="source" aria-label="C++ source" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
    <div class="editor-controls"><button class="button small warm run">Run code <span aria-hidden="true">▶</span></button><button class="button small secondary stop" disabled>Stop</button><button class="button small secondary reset">Reset</button><button class="button small secondary export">Download .cpp</button><span class="status" role="status">Ready</span></div>
    <details class="input-area" ${persistent?'open':''}><summary class="input-label">Program input (stdin)</summary><textarea class="stdin" aria-label="Program input" spellcheck="false"></textarea></details>
    <pre class="output" aria-label="Program output" aria-live="polite">Your output will appear here.</pre>
  </section>`;
  const root=target.querySelector('.editor'),source=root.querySelector('.source'),stdin=root.querySelector('.stdin'),output=root.querySelector('.output'),status=root.querySelector('.status');
  const run=root.querySelector('.run'),stop=root.querySelector('.stop'),reset=root.querySelector('.reset');
  source.value=read('draft:'+id,code);stdin.value=read('input:'+id,input);
  let worker,timer,disposed=false,busy=false;
  const save=()=>{
    if(!write('draft:'+id,source.value))notice('Draft kept for this session. Browser storage could not save it; download your source to keep a copy.');
  };
  source.addEventListener('input',save);
  stdin.addEventListener('input',()=>{if(!write('input:'+id,stdin.value))notice('Input is available for this session; browser storage could not save it.');});
  const setBusy=value=>{busy=value;root.dataset.busy=String(value);run.disabled=value;stop.disabled=!value;reset.disabled=value;};
  function cancel(message='Stopped. Previous saved file retained.') {
    clearTimeout(timer);worker?.terminate();worker=undefined;setBusy(false);status.textContent=message;
  }
  const deadline=(ms,message)=>{clearTimeout(timer);timer=setTimeout(()=>cancel(message),ms);};
  stop.addEventListener('click',()=>cancel());
  reset.addEventListener('click',()=>{source.value=code;save();status.textContent='Original example restored';});
  root.querySelector('.export').addEventListener('click',()=>download(id+'.cpp',source.value,'text/plain'));
  run.addEventListener('click',()=>{
    if(busy||disposed)return;
    setBusy(true);output.textContent='';status.textContent='Starting…';
    deadline(120000,'Build stopped after two minutes. Retry when ready.');
    if(!worker){
      worker=new Worker(new URL('./compiler/worker.js',import.meta.url));
      worker.onerror=error=>{output.textContent=error.message;cancel('Compiler worker failed. Try Run again.');};
      worker.onmessage=async({data})=>{
        if(disposed)return;
        if(data.type==='stage'){
          status.textContent={loading:'Loading compiler…',compiling:'Compiling…',linking:'Linking…',running:'Running…'}[data.stage];
          if(data.stage==='running')deadline(5000,'Program stopped after five seconds. Previous saved file retained.');
          return;
        }
        clearTimeout(timer);
        output.textContent=[data.output,data.diagnostics,data.type==='error'?data.message:''].filter(Boolean).join('\n')||'(no output)';
        if(data.type==='error'){
          status.textContent=`Failed during ${data.phase}`;worker.terminate();worker=undefined;
        } else {
          status.textContent=`Finished · exit ${data.exitCode}`;
          try {await onResult(data);}catch(error){notice(error.message);}
        }
        if(!disposed)setBusy(false);
      };
    }
    worker.postMessage({code:source.value,input:stdin.value,persistent,database:getDatabase()});
  });
  return {source,stdin,root,dispose(){disposed=true;clearTimeout(timer);worker?.terminate();},setSource(value){source.value=value;save();}};
}
