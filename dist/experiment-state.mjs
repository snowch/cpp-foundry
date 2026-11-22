// Course adapter for the shared two-phase offline restart protocol.
import {write,hasSaved} from './storage.js';
import {runnerBusy} from './course-controls.mjs';
let editor,composing=false,lock,timer;
const key='cpp-foundry:reading-snapshot';
export function registerReadingState(value){editor=value;}
export function saveReadingState(){
 if(composing||runnerBusy()||document.readyState!=='complete')throw Error('Finish typing and wait for the current run to finish.');
 editor?.save();
 const prediction=document.querySelector('#prediction');if(prediction){const id=location.hash.split('/').at(-1);if(!write('prediction:'+id,prediction.value)||!hasSaved('prediction:'+id,prediction.value))throw Error('Your prediction could not be saved. Copy it before reloading.');}
 const snapshot={hash:location.hash,scroll:[scrollX,scrollY],details:[...document.querySelectorAll('main details')].map((el,index)=>[index,el.open]),editor:editor?.snapshot()};
 const encoded=JSON.stringify(snapshot);sessionStorage.setItem(key,encoded);if(sessionStorage.getItem(key)!==encoded)throw Error('This window could not save its work. Allow browser storage or export the source first.');
}
export function restoreReadingState(){
 let saved;try{saved=JSON.parse(sessionStorage.getItem(key));}catch{return;}if(!saved||saved.hash!==location.hash)return;
 editor?.restore(saved.editor);const details=[...document.querySelectorAll('main details')];for(const [index,open]of saved.details)if(details[index])details[index].open=open;
 requestAnimationFrame(()=>scrollTo(...saved.scroll));sessionStorage.removeItem(key);
}
function unlock(){clearTimeout(timer);lock=null;for(const el of document.querySelectorAll('main,.site-header'))el.inert=false;}
addEventListener('compositionstart',()=>composing=true);addEventListener('compositionend',()=>composing=false);
navigator.serviceWorker?.addEventListener('message',({data,ports})=>{
 if(data?.type==='PREPARE_RESTART')try{if(lock)throw Error('This window is already restarting.');saveReadingState();lock=data.token;for(const el of document.querySelectorAll('main,.site-header'))el.inert=true;timer=setTimeout(unlock,12000);ports[0].postMessage({ready:true});}catch(error){ports[0].postMessage({ready:false,error:error.message});}
 if(data?.type==='ABORT_RESTART'&&data.token===lock){unlock();sessionStorage.removeItem(key);}
 if(data?.type==='COMMIT_RESTART'&&data.token===lock)location.reload();
});
