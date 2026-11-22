// One compiler worker per reading window; hash navigation leaves it warm.
import {mountRuntimeRecovery} from './runtime-recovery.mjs';
import {saveReadingState} from './experiment-state.mjs';
const key='cpp-foundry:runner-idle',introKey='cpp-foundry:runner-intro:1',choices=[5,15,30,60];
let minutes=30;try{const saved=Number(localStorage.getItem(key));if(choices.includes(saved))minutes=saved;}catch{}
let worker,pending,lastUsed=0,expiry,phase='Stopped',generation=0,origin;
const button=document.querySelector('#code-runner-open'),summary=document.querySelector('#runner-summary');
const dialog=document.createElement('dialog');dialog.id='code-runner-dialog';dialog.setAttribute('aria-labelledby','runner-title');
dialog.innerHTML=`<div class="status-heading"><h2 id="runner-title">Code runner</h2><button type="button" data-close>Close</button></div><p data-state role="status">Stopped</p><p>The C++ compiler and your program use this device’s CPU and memory. Keeping the compiler ready avoids loading it again between lessons. Your code, results and saved database are kept when the runner stops.</p><label for="runner-idle">Stop after this long without a run</label><select id="runner-idle">${choices.map(n=>`<option value="${n}">${n} minutes</option>`).join('')}</select><p class="runner-cpu-note">CPU use rises while compiling or running. A ready worker keeps memory allocated. Browsers do not expose a reliable per-runner CPU percentage or total memory measurement.</p><div class="status-actions"><button type="button" class="primary" data-start>Start runner</button><button type="button" data-stop hidden>Free memory</button></div>`;
document.body.append(dialog);
const intro=document.createElement('dialog');intro.id='runner-intro';intro.setAttribute('aria-labelledby','runner-intro-title');intro.innerHTML='<h2 id="runner-intro-title">Code runs on your device</h2><p>The C++ compiler and your program use this device’s CPU and memory. The runner stays ready between lessons to make later runs faster.</p><p data-time></p><p>Use <strong>Code runner</strong> in the header to change the time or free memory sooner. Your code, results and saved database are kept.</p><button type="button" class="primary" data-back>Continue run</button><button type="button" data-settings>Runner settings</button>';document.body.append(intro);
const recovery=mountRuntimeRecovery({save:saveReadingState,beforeOpen(){const focus=intro.open?origin:dialog.open?button:document.activeElement;if(intro.open)intro.close('cancel');if(dialog.open)dialog.close();return focus;},runLabel:'Run code'});
export const runtimeRecovery=recovery;
function state(value){phase=value;summary.textContent=value;dialog.querySelector('[data-state]').textContent=value;dialog.querySelector('[data-start]').hidden=!!worker;dialog.querySelector('[data-stop]').hidden=!worker;}
function touch(){lastUsed=Date.now();clearTimeout(expiry);if(worker&&!pending)expiry=setTimeout(checkIdle,minutes*60000);}
function checkIdle(){if(worker&&!pending&&Date.now()-lastUsed>=minutes*60000)stopRunner('Stopped after inactivity');else if(worker&&!pending)expiry=setTimeout(checkIdle,Math.max(10,minutes*60000-(Date.now()-lastUsed)));}
export function stopRunner(message='Stopped'){
 const job=pending;pending=null;generation++;clearTimeout(expiry);if(job)clearTimeout(job.timer);worker?.terminate();worker=null;state(message);job?.callback({type:'cancelled',message});
}
function failure(data){const job=pending;pending=null;clearTimeout(job?.timer);worker?.terminate();worker=null;state('Could not start');job?.callback(data);recovery.open();}
function createWorker(){
 if(worker)return;worker=new Worker(new URL('./compiler/worker.js',import.meta.url));
 worker.onerror=event=>{event.preventDefault();failure({type:'error',phase:'loading',runtimeLoad:true,message:event.message||'Compiler worker could not start.'});};
 worker.onmessage=({data})=>{
  const job=pending;if(!job)return;
  if(data.type==='stage'){
   state({loading:'Starting',compiling:'Compiling',linking:'Linking',running:'Running'}[data.stage]||'Working');
   if(data.stage==='running'){clearTimeout(job.timer);job.timer=setTimeout(()=>stopRunner('Program stopped after five seconds.'),5000);}
   job.callback(data);return;
  }
  if(data.runtimeLoad){failure(data);return;}
  pending=null;clearTimeout(job.timer);state('Ready');touch();job.callback(data);
 };
}
function begin(data,callback){
 if(pending)throw Error('Another program is running. Stop it before starting another run.');
 clearTimeout(expiry);createWorker();state('Starting');
 pending={callback,timer:setTimeout(()=>stopRunner('Build stopped after two minutes. Check your connection if this is the first run.'),120000)};
 worker.postMessage(data);
}
export async function execute(data,callback){
 let acknowledged=false;try{acknowledged=localStorage.getItem(introKey)==='1';}catch{}
 if(!worker&&!acknowledged){
  origin=document.activeElement;intro.querySelector('[data-time]').textContent=`It stops after ${minutes} minutes without a run.`;
  intro.showModal();
  return new Promise(resolve=>{
   const continueRun=()=>{intro.removeEventListener('close',continueRun);if(intro.returnValue==='cancel'){callback({type:'cancelled',message:'Run cancelled.'});resolve();return;}try{localStorage.setItem(introKey,'1');}catch{}begin(data,callback);resolve();};intro.returnValue='';intro.addEventListener('close',continueRun,{once:true});
  });
 }
 begin(data,callback);
}
button.onclick=()=>{origin=button;dialog.showModal();};
dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>origin?.isConnected&&origin.focus({preventScroll:true}));
dialog.querySelector('[data-start]').onclick=()=>{
 try{localStorage.setItem(introKey,'1');}catch{}
 try{begin({type:'prepare'},()=>{});}catch(error){dialog.querySelector('[data-state]').textContent=error.message;}
};
dialog.querySelector('[data-stop]').onclick=()=>stopRunner();
dialog.querySelector('#runner-idle').value=String(minutes);
dialog.querySelector('#runner-idle').onchange=event=>{minutes=Number(event.target.value);try{localStorage.setItem(key,String(minutes));}catch{}if(worker&&!pending)checkIdle();};
intro.addEventListener('cancel',event=>{event.preventDefault();intro.close('cancel');origin?.focus();});intro.querySelector('[data-back]').onclick=()=>intro.close('run');intro.querySelector('[data-settings]').onclick=()=>{intro.close();dialog.showModal();};
addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkIdle();});
addEventListener('pagehide',()=>stopRunner());
const theme=document.querySelector('#theme');
function themeLabel(){theme.textContent=document.documentElement.dataset.theme==='dark'?'Light theme':'Dark theme';}themeLabel();
theme.onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('cpp-foundry-theme',document.documentElement.dataset.theme);}catch{}themeLabel();};
export const runnerBusy=()=>!!pending;
// Observable identity is useful for verifying warm reuse without exposing memory claims.
export const runnerIdentity=()=>({generation,ready:!!worker&&!pending,state:phase});
