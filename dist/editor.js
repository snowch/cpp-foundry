import {read,write,hasSaved,isInMemory} from './storage.js';

export function download(name,bytes,type='application/octet-stream') {
  const url=URL.createObjectURL(new Blob([bytes],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function mountEditor(target,{id,code,input='',persistent=false,getDatabase=()=>null,onResult=async()=>{},notice=()=>{}}) {
  const filename=persistent?'record-store.cpp':'main.cpp';
  target.innerHTML=`<section class="editor" aria-label="C++ editor" data-busy="false">
    <div class="editor-heading"><label for="source-code">${filename}</label><details class="editor-tools"><summary>Editor tools</summary>
      <div class="tool-buttons"><button type="button" class="button small secondary reset">Restore starter source</button><button type="button" class="button small secondary undo" hidden>Undo restore</button><button type="button" class="button small secondary export">Download source</button></div>
    </details></div>
    <p class="source-save-warning" role="status" hidden></p>
    <textarea id="source-code" class="source" aria-label="C++ source" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off"></textarea>
    ${persistent?`<div class="input-area"><label class="input-label" for="program-input">Program input</label><p>Enter one command per line before choosing <strong>Run code</strong>.</p>`:`<details class="input-area" ${input?'open':''}><summary class="input-label">Program input (stdin)</summary><label class="input-label" for="program-input">Text passed to the program when it starts</label>`}
    <textarea id="program-input" class="stdin" aria-label="Program input" spellcheck="false"></textarea>${persistent?'</div>':'</details>'}
    <div class="editor-controls"><button type="button" class="button small warm run" aria-keyshortcuts="Control+Enter Meta+Enter">Run code</button><button type="button" class="button small secondary stop" hidden>Stop</button><span class="status" role="status"></span></div>
    <p class="run-warning" role="status" hidden></p><pre class="run-diagnostic" aria-label="Compiler or runtime messages" hidden></pre>
    <div class="output-area"><h3>Program output</h3><p class="output-context" hidden></p><pre class="output" aria-label="Program output" aria-live="polite">Choose Run code to see the output.</pre></div>
  </section>`;
  const root=target.querySelector('.editor');
  const get=selector=>root.querySelector(selector);
  const source=get('.source'),stdin=get('.stdin'),output=get('.output'),status=get('.status');
  const run=get('.run'),stop=get('.stop'),reset=get('.reset'),undo=get('.undo');
  const saveWarning=get('.source-save-warning'),runWarning=get('.run-warning');
  const diagnostics=get('.run-diagnostic'),provenance=get('.output-context');
  const draftKey='draft:'+id,inputKey='input:'+id,recoveryKey='restore:'+id;
  source.value=read(draftKey,code);stdin.value=read(inputKey,input);
  let backup=read(recoveryKey,null);
  let worker,timer,disposed=false,busy=false,request,result,attemptFailed=false;
  let inputSaved=!isInMemory(inputKey)||hasSaved(inputKey,stdin.value);
  let draftSaved=!isInMemory(draftKey)||hasSaved(draftKey,source.value);
  let backupSaved=backup===null||hasSaved(recoveryKey,backup);
  function showDraftStatus() {
    reset.disabled=busy||source.value===code;undo.disabled=busy;undo.hidden=backup===null;
    saveWarning.hidden=draftSaved&&inputSaved;
    if(!draftSaved){
      saveWarning.textContent='This source is available in this tab until you reload. Use Download source in Editor tools to keep a copy.';
      if(!inputSaved)saveWarning.textContent+=' Copy the input separately.';
    }
    else if(!inputSaved)saveWarning.textContent='Browser storage could not save this input. Copy it before reloading the page.';
  }
  function showResult() {
    provenance.hidden=!result;
    if(!result)return;
    if(attemptFailed)provenance.textContent='Output from the last program that ran. Read the latest attempt above.';
    else if(result.code!==source.value||result.input!==stdin.value)provenance.textContent='Output from earlier source or input. Choose Run code again to see the effect of your changes.';
    else if(busy)provenance.textContent='Output from the previous run. The new run is in progress.';
    else provenance.hidden=true;
  }
  function save() {
    if(backup!==null&&!backupSaved)backupSaved=write(recoveryKey,backup);
    if(backupSaved)draftSaved=write(draftKey,source.value);
    else {write(draftKey,source.value,{sessionOnly:true});draftSaved=false;}
    showDraftStatus();showResult();
  }
  source.addEventListener('input',save);
  stdin.addEventListener('input',()=>{
    inputSaved=write(inputKey,stdin.value);
    showDraftStatus();showResult();
  });
  function setBusy(value) {
    busy=value;root.dataset.busy=String(value);run.disabled=value;stop.hidden=!value;
    source.readOnly=value;stdin.readOnly=value;
    showDraftStatus();showResult();
  }
  function cancel(message='Stopped.') {
    const focusRun=document.activeElement===stop;
    clearTimeout(timer);worker?.terminate();worker=undefined;
    attemptFailed=true;setBusy(false);
    status.textContent=message+(persistent?' The previously saved database is still available.':'');
    if(focusRun)run.focus();
  }
  const deadline=(ms,message)=>{clearTimeout(timer);timer=setTimeout(()=>cancel(message),ms);};
  stop.addEventListener('click',()=>cancel());
  reset.addEventListener('click',()=>{
    backup=source.value;
    backupSaved=write(recoveryKey,backup);
    source.value=code;save();status.textContent='Starter source restored.';
  });
  undo.addEventListener('click',()=>{
    if(backup===null)return;
    source.value=backup;
    draftSaved=write(draftKey,source.value);
    if(draftSaved){backup=null;backupSaved=true;write(recoveryKey,null);}
    showDraftStatus();showResult();
    status.textContent='Previous source recovered.';source.focus();
  });
  get('.export').addEventListener('click',()=>download(persistent?filename:id+'.cpp',source.value,'text/plain'));
  root.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();run.click();}
  });
  setBusy(false);
  run.addEventListener('click',()=>{
    if(busy||disposed)return;
    request={code:source.value,input:stdin.value,persistent,database:getDatabase()};
    attemptFailed=false;setBusy(true);runWarning.hidden=true;diagnostics.hidden=true;status.textContent='Preparing to run…';
    deadline(120000,'Build stopped after two minutes. Check your connection if this is the first run.');
    if(!worker){
      worker=new Worker(new URL('./compiler/worker.js',import.meta.url));
      worker.onerror=error=>{
        runWarning.textContent='Compiler worker failed to start.';
        runWarning.hidden=false;
        diagnostics.textContent=error.message;diagnostics.hidden=false;
        cancel('Compiler worker failed. Choose Run code to retry.');
      };
      worker.onmessage=async({data})=>{
        if(disposed)return;
        if(data.type==='stage'){
          status.textContent={loading:'Loading compiler…',compiling:'Compiling…',linking:'Linking…',running:'Running…'}[data.stage];
          if(data.stage==='running')deadline(5000,'Program stopped after five seconds.');
          return;
        }
        clearTimeout(timer);
        if(data.type==='error'){
          attemptFailed=true;
          runWarning.textContent='Failed during '+data.phase+'. Read the messages and check your edit.';
          runWarning.hidden=false;
          diagnostics.textContent=[data.output,data.diagnostics,data.message].filter(Boolean).join('\n');
          diagnostics.hidden=!diagnostics.textContent;
          status.textContent='Failed during '+data.phase;
          worker.terminate();worker=undefined;
        } else {
          result=request;output.textContent=data.output||'(no output)';
          diagnostics.textContent=data.diagnostics||'';diagnostics.hidden=!diagnostics.textContent;
          status.textContent=`Finished · exit ${data.exitCode}`;
          try {await onResult(data);}catch(error){notice(error.message);}
        }
        if(!disposed)setBusy(false);
      };
    }
    worker.postMessage(request);
  });
  return {source,stdin,root,dispose(){disposed=true;clearTimeout(timer);worker?.terminate();}};
}
