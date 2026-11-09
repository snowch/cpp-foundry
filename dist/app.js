import {parts,chapters,lessons,byId} from './course.js';
import {read,write,onStorage,loadDatabase,storeDatabase,validateDatabase} from './storage.js';
import {mountEditor,download} from './editor.js';

const main=document.querySelector('main');
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dispose=()=>{},routeToken=0,noticeTimer;
function notice(message){const element=document.querySelector('#notice');element.textContent=message;element.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{element.hidden=true;},16000);}
const done=id=>read('done:'+id)==='1';
const doneCount=items=>items.filter(l=>done(l.id)).length;
const number=index=>String(index+1).padStart(2,'0');
function tick(id){return `<span class="tick ${done(id)?'done':''}" aria-label="${done(id)?'Completed':'Not completed'}">${done(id)?'✓':''}</span>`;}
function progress(){const count=doneCount(lessons);return `<div class="progress-bar" role="progressbar" aria-label="Reading completion" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${lessons.length}"><span style="width:${count/lessons.length*100}%"></span></div><p class="progress-label">${count} of ${lessons.length} lessons complete · saved on this browser</p>`;}
function chapterCards(){return parts.map((part,index)=>{
  const group=chapters.filter(c=>c.part===part.id),ids=new Set(group.map(c=>c.id));
  const content=lessons.filter(l=>ids.has(l.chapter));
  return `<a class="chapter-card" href="#/course/${part.id}"><div class="chapter-number"><span>PART ${number(index)}</span><span aria-hidden="true">→</span></div><h3>${part.title}</h3><p>${part.description}</p><div class="meta"><span>${group.length} chapters · ${content.length} lessons</span><span>${doneCount(content)}/${content.length} complete</span></div></a>`;
}).join('');}
function renderHome(){
  document.title='C++ Foundry · Learn by building';
  const next=lessons.find(l=>!done(l.id))||lessons[0];
  main.innerHTML=`<div class="container"><section class="hero"><div><div class="eyebrow">A practical course in modern C++</div><h1>Build things.<br>Understand what<br><em>owns them.</em></h1><p class="lead">Learn C++20 through small, working programs. Follow values, lifetimes, and algorithms all the way to a persistent record store you can make your own.</p><div class="actions"><a class="button" href="#/lesson/${next.id}">${doneCount(lessons)?'Continue learning':'Start the course'} <span aria-hidden="true">→</span></a><a class="button secondary" href="#/workbench">Try the Workbench</a></div><p class="hero-note">Read, edit, and run in your browser. No install for the core lessons.</p></div><div class="hero-code" aria-label="C++ ownership example"><div class="window-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="filename">a_little_ownership.cpp</span></div><pre><span class="comment">// Values first. Ownership made clear.</span>
<span class="keyword">#include</span> &lt;memory&gt;
<span class="keyword">#include</span> &lt;string&gt;
<span class="keyword">#include</span> &lt;iostream&gt;

<span class="keyword">int</span> main() {
    <span class="keyword">auto</span> name = std::make_unique&lt;std::string&gt;(
        <span class="string">"Ada"</span>
    );
    std::cout &lt;&lt; *name &lt;&lt; <span class="string">'\\n'</span>;
} <span class="comment">// Resource released. Automatically.</span></pre><div class="code-result"><span>✓ Ada</span><span>C++20 · WebAssembly</span></div></div></section>
  <div class="stats"><div class="stat"><b>${lessons.length}</b><span>Authored lessons</span></div><div class="stat"><b>${parts.length} / ${chapters.length}</b><span>Parts / chapters</span></div><div class="stat"><b>${lessons.filter(l=>!l.native).length} + ${lessons.filter(l=>l.native).length}</b><span>Browser examples + native labs</span></div><div class="stat"><b>C++20</b><span>Values to database systems</span></div></div>
  <section><div class="section-heading"><div><div class="eyebrow">Your path through the course</div><h2>From a value to a working system.</h2></div><p>Each lesson pairs an explanation with a complete program, a question, and an experiment.</p></div><div class="chapter-grid">${chapterCards()}</div></section>
  <section class="capstone-callout"><div><div class="eyebrow">The capstone</div><h2>A small store. Real persistence.</h2><p>Insert, update, and delete records. Define a byte format, reject corrupt data, and reopen a saved file. Explore the full C++ source in the Workbench.</p></div><a class="button" href="#/workbench">Open Workbench <span aria-hidden="true">→</span></a></section></div>`;
}
function renderCourse(selected){
  document.title='Course · C++ Foundry';
  const visible=parts.some(p=>p.id===selected)?parts.filter(p=>p.id===selected):parts;
  main.innerHTML=`<div class="container"><div class="page-top"><div class="eyebrow">The course</div><h1>Learn it. Run it. Make it yours.</h1><p>${parts.length} parts, ${chapters.length} chapters, and ${lessons.length} worked lessons: modern C++, algorithms, data structures, storage, recovery, portability, and concurrency.</p>${progress()}<nav class="part-links" aria-label="Course parts"><a href="#/course" ${visible.length===parts.length?'aria-current="page"':''}>All parts</a>${parts.map((part,index)=>`<a href="#/course/${part.id}" ${selected===part.id?'aria-current="page"':''}>${number(index)} · ${part.title}</a>`).join('')}</nav></div>${visible.map(part=>`<section class="course-part"><div class="part-heading"><div class="eyebrow">Part ${number(parts.indexOf(part))}</div><h2>${part.title}</h2><p>${part.description}</p></div>${chapters.filter(c=>c.part===part.id).map(chapter=>{
    const content=lessons.filter(l=>l.chapter===chapter.id);
    return `<section class="outline-chapter"><div><div class="eyebrow">Chapter ${number(chapters.indexOf(chapter))}</div><h3>${chapter.title}</h3><p>${chapter.description}</p></div><ol class="lesson-links">${content.map(l=>`<li><a href="#/lesson/${l.id}">${tick(l.id)}<span class="lesson-label">${l.title}</span>${l.native?'<span class="tag">Native lab</span>':''}<span aria-hidden="true">→</span></a></li>`).join('')}</ol></section>`;
  }).join('')}</section>`).join('')}<section class="capstone-callout"><div><h2>Put the pieces together.</h2><p>The Workbench includes an editable record store with persistent browser files. Later chapters provide executable components and bounded models to assemble and extend.</p></div><a href="#/workbench" class="button">Open Workbench →</a></section></div>`;
}
function contents(current){const group=chapters.find(c=>c.id===current.chapter).part;return `<aside class="contents"><h2>Contents</h2><a class="progress-label" href="#/course">${doneCount(lessons)}/${lessons.length} complete · all chapters</a><label class="part-label" for="part-select">Course part</label><select id="part-select" class="part-select" aria-label="Course part">${parts.map((part,index)=>`<option value="${part.id}" ${part.id===group?'selected':''}>${number(index)} · ${part.title}</option>`).join('')}</select>${chapters.filter(c=>c.part===group).map(chapter=>`<details ${chapter.id===current.chapter?'open':''}><summary>${number(chapters.indexOf(chapter))} · ${chapter.title}</summary><ol>${lessons.filter(l=>l.chapter===chapter.id).map(l=>`<li><a href="#/lesson/${l.id}" ${l.id===current.id?'aria-current="page"':''}>${done(l.id)?'✓ ':''}${l.title}</a></li>`).join('')}</ol></details>`).join('')}</aside>`;}
function renderLesson(lesson){
  const chapter=chapters.find(c=>c.id===lesson.chapter),index=lessons.indexOf(lesson),chapterIndex=chapters.indexOf(chapter),chapterLessons=lessons.filter(l=>l.chapter===chapter.id),part=parts.find(p=>p.id===chapter.part);
  document.title=lesson.title+' · C++ Foundry';
  main.innerHTML=`<div class="reading-layout">${contents(lesson)}<article class="lesson-article"><p class="breadcrumbs"><a href="#/course/${part.id}">${part.title}</a> / ${chapter.title}</p><div class="eyebrow">Chapter ${number(chapterIndex)} · Lesson ${chapterLessons.indexOf(lesson)+1} of ${chapterLessons.length}</div><h1>${lesson.title}</h1><div class="lesson-meta">${lesson.native?'Native investigation · C++20':'Runnable in your browser · C++20'} · about 10–15 minutes with the experiment</div>${lesson.body.map(p=>`<p>${escape(p)}</p>`).join('')}
    <h2>A complete worked program</h2><div id="lesson-editor"></div>
    <details class="disclosure"><summary>Expected output</summary><pre class="expected">${escape(lesson.expected)}</pre></details><p>${escape(lesson.walkthrough)}</p>
    <aside class="callout"><strong>A pitfall to watch for</strong>${escape(lesson.pitfall)}</aside>
    <section class="question"><h2>Check your understanding</h2><p>${escape(lesson.question)}</p><div class="choices">${lesson.choices.map((choice,i)=>`<button class="choice" data-choice="${i}" aria-pressed="false">${escape(choice)}</button>`).join('')}</div><div class="feedback" role="status"></div></section>
    <section class="experiment"><h2>Make one change.</h2>${escape(lesson.experiment)}</section>
    ${lesson===chapterLessons.at(-1)?`<section class="callout"><strong>Chapter project</strong>${escape(chapter.project)}${chapter.id==='records'?' <a href="#/workbench">Open the Workbench →</a>':''}</section>`:''}
    <label class="completion"><input id="completed" type="checkbox" ${done(lesson.id)?'checked':''}> Mark lesson as done <small>Reading completion is separate from running a program.</small></label>
    <nav class="lesson-nav" aria-label="Lesson navigation">${index?`<a href="#/lesson/${lessons[index-1].id}"><small>← Previous</small>${lessons[index-1].title}</a>`:'<a href="#/course"><small>← Back</small>Course outline</a>'}${index<lessons.length-1?`<a href="#/lesson/${lessons[index+1].id}"><small>Next →</small>${lessons[index+1].title}</a>`:'<a href="#/workbench"><small>Build next →</small>Record-store Workbench</a>'}</nav></article></div>`;
  const target=document.querySelector('#lesson-editor');
  if(lesson.native){
    const command=`g++ -std=c++20 -Wall -Wextra -Werror ${lesson.flags||''} native/examples/${lesson.id}.cpp -o /tmp/${lesson.id}\n/tmp/${lesson.id}`;
    target.innerHTML=`<div class="callout"><strong>${escape(lesson.reason||'This investigation uses native threads.')}</strong>Open the repository in Codespaces or use a compatible local C++20 toolchain. Other examples marked for the browser work without a Codespace.</div><pre class="native-source">${escape(lesson.code)}</pre><pre class="native-command">${escape(command)}</pre><div class="actions"><a class="button small" href="https://codespaces.new/snowch/cpp-foundry?quickstart=1" target="_blank" rel="noopener">Open Codespaces ↗</a><button class="button small secondary" id="copy-command">Copy command</button><a class="button small secondary" href="https://github.com/snowch/cpp-foundry/blob/main/native/examples/${lesson.id}.cpp">View source ↗</a></div><p class="progress-label">Codespaces uses your GitHub account’s compute and storage allowance.</p>`;
    document.querySelector('#copy-command').onclick=()=>navigator.clipboard.writeText(command).then(()=>notice('Command copied.')).catch(()=>notice('Select and copy the command shown above.'));
  } else {
    const editor=mountEditor(target,{id:lesson.id,code:lesson.code,input:lesson.input||'',notice});dispose=()=>editor.dispose();
  }
  document.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-choice]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
    button.classList.add('selected');button.setAttribute('aria-pressed','true');
    document.querySelector('.feedback').textContent=(Number(button.dataset.choice)===lesson.answer?'Correct. ':'Try again. ')+(Number(button.dataset.choice)===lesson.answer?lesson.feedback:'Think about the operation and its lifetime or precondition, then choose again.');
  }));
  document.querySelector('#completed').addEventListener('change',event=>{
    const saved=write('done:'+lesson.id,event.target.checked?'1':'0');
    document.querySelector('.contents').outerHTML=contents(lesson);
    if(!saved)notice('Completion kept for this session. Browser storage could not save it.');
  });
}

async function renderWorkbench(token){
  document.title='Workbench · C++ Foundry';
  main.innerHTML=`<div class="container workbench"><div class="page-top"><div class="eyebrow">Your C++ Workbench</div><h1>A record store you can take apart.</h1><p>This is a real C++ program, compiled to WebAssembly in your browser. Edit the source or send it commands. Use SAVE to publish a file, then run again to reopen it.</p></div><div class="workbench-layout"><div id="workbench-editor"><p>Loading source and saved file…</p></div><aside><h2>people.cpf</h2><div class="file-status" role="status">Opening browser storage…</div><div class="file-actions"><button id="download-db" class="button small secondary" disabled>Download file</button><label class="button small secondary" for="import-db">Import file</label><input id="import-db" type="file" accept=".cpf,application/octet-stream" hidden></div><p>Import replaces the current database after validation. Downloads keep the exact CPF1 bytes.</p><h2>Commands</h2><pre class="command-help">INSERT 1 "Ada" 90
UPDATE 1 "Ada" 95
DELETE 1
LIST
COUNT
SAVE
LOAD</pre><p>Commands are uppercase. Names must be quoted. IDs are positive uint32 values; scores are 0–100. Capacity: 1,000 rows.</p><p>SAVE writes a snapshot. Unsaved row changes last only for that run. Successful runs retain people.cpf in this browser; clearing site data removes it.</p><a href="#/lesson/row-model">Read the capstone lessons →</a><p><a href="record-store.cpp" download>Download original source</a></p></aside></div><p class="progress-label">Browser files are not a crash-durable database service. This first store uses a map and whole-file snapshots; it has no SQL parser, disk B-tree, or multi-client transactions.</p></div>`;
  let bytes=null,revision=0,available=true,unsaved=false;
  const status=document.querySelector('.file-status'),downloadButton=document.querySelector('#download-db'),importInput=document.querySelector('#import-db');
  function describe(message){status.textContent=message||(bytes?`${bytes.length.toLocaleString()} bytes · saved in this browser`:'No saved file yet. Run INSERT and SAVE to create one.');downloadButton.disabled=!bytes;}
  const sourcePromise=fetch('record-store.cpp').then(response=>{if(!response.ok)throw Error('Could not load record-store source.');return response.text();}).catch(error=>error);
  try {const file=await loadDatabase();bytes=file.bytes?new Uint8Array(file.bytes):null;revision=file.revision;}
  catch(error){available=false;describe('Browser storage unavailable. Files will remain downloadable for this session.');}
  if(token!==routeToken)return;
  if(available)describe();
  let source;
  source=await sourcePromise;
  if(source instanceof Error){if(token===routeToken)document.querySelector('#workbench-editor').textContent=source.message;return;}
  if(token!==routeToken)return;
  async function save(candidate){
    if(!unsaved&&bytes&&candidate.length===bytes.length&&candidate.every((byte,i)=>byte===bytes[i]))return true;
    bytes=new Uint8Array(candidate);downloadButton.disabled=false;
    unsaved=true;
    try {if(!available)throw Error('Browser storage unavailable. Download the current database to keep it.');revision=await storeDatabase(bytes,revision);unsaved=false;describe();return true;}
    catch(error){describe('Unsaved current file · download available');notice(error.message);return false;}
  }
  const editor=mountEditor(document.querySelector('#workbench-editor'),{id:'workbench',code:source,input:'INSERT 1 "Ada" 90\nINSERT 2 "Grace" 95\nLIST\nSAVE\n',persistent:true,getDatabase:()=>bytes,notice,
    onResult:async result=>{if(result.database&&result.exitCode===0)await save(result.database);}});
  dispose=()=>editor.dispose();
  downloadButton.onclick=()=>{if(bytes)download('people.cpf',bytes);};
  importInput.onchange=async()=>{
    const file=importInput.files[0];if(!file)return;
    if(editor.root.dataset.busy==='true'){notice('Stop the running program before importing.');importInput.value='';return;}
    const runButton=editor.root.querySelector('.run');runButton.disabled=true;importInput.disabled=true;
    try {if(file.size>1048576)throw Error('Database is limited to 1 MB.');const candidate=new Uint8Array(await file.arrayBuffer());const count=validateDatabase(candidate);if(await save(candidate))notice(`Imported ${count} validated rows. Run LIST to inspect them.`);}
    catch(error){notice(`Import rejected: ${error.message}`);}finally{importInput.value='';importInput.disabled=false;runButton.disabled=false;}
  };
}
function render(){
  dispose();dispose=()=>{};const token=++routeToken;
  const route=(location.hash||'#/').slice(1).split('/').filter(Boolean);
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===route[0]||(a.dataset.nav==='course'&&route[0]==='lesson'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(!route.length)renderHome();
  else if(route[0]==='course')renderCourse(route[1]);
  else if(route[0]==='lesson'&&byId.has(route[1]))renderLesson(byId.get(route[1]));
  else if(route[0]==='workbench')renderWorkbench(token).catch(error=>notice(error.message));
  else {document.title='Page not found · C++ Foundry';main.innerHTML='<div class="container empty"><h1>That lesson could not be found.</h1><a href="#/course">Open the course outline →</a></div>';}
  window.scrollTo(0,0);
}
addEventListener('hashchange',render);
main.addEventListener('change',event=>{if(event.target.matches('.part-select')){const chapter=chapters.find(c=>c.part===event.target.value);const lesson=lessons.find(l=>l.chapter===chapter.id);location.hash='#/lesson/'+lesson.id;}});
onStorage(key=>{
  if(!key.startsWith('done:'))return;
  const match=location.hash.match(/^#\/lesson\/([^/]+)/);
  if(match&&byId.has(match[1])){
    document.querySelector('#completed').checked=done(match[1]);document.querySelector('.contents').outerHTML=contents(byId.get(match[1]));
  }else if(!location.hash||location.hash==='#/'||location.hash.startsWith('#/course'))render();
});
render();
