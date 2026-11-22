import './course-controls.mjs';
import {registerReadingState,restoreReadingState} from './experiment-state.mjs';
import {materialSymbol} from './material-symbols.mjs';
import {parts,chapters,lessons,byId} from './course.js';
import {read,write,hasSaved,isInMemory,onStorage,loadDatabase,storeDatabase,validateDatabase} from './storage.js';
import {mountEditor,download} from './editor.js';
import {renderDiagram} from './diagram-view.js';
import {edits,nativeCommand} from './experiment-edits.js';

const main=document.querySelector('main');
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let dispose=()=>{},routeToken=0,noticeTimer;
function notice(message){const element=document.querySelector('#notice');element.textContent=message;element.hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{element.hidden=true;},16000);}
const done=id=>read('done:'+id)==='1';
const doneCount=items=>items.filter(l=>done(l.id)).length;
const number=index=>String(index+1).padStart(2,'0');
function tick(id){return `<span class="tick ${done(id)?'done':''}" aria-label="${done(id)?'Completed':'Not completed'}">${done(id)?'✓':''}</span>`;}
function progress(){const count=doneCount(lessons),temporary=lessons.some(({id})=>isInMemory('done:'+id)&&!hasSaved('done:'+id,read('done:'+id)));return `<div class="progress-bar" role="progressbar" aria-label="Reading completion" aria-valuenow="${count}" aria-valuemin="0" aria-valuemax="${lessons.length}"><span style="width:${count/lessons.length*100}%"></span></div><p class="progress-label">${count} of ${lessons.length} lessons complete${temporary?' · some marks are available until reload':''}</p>`;}
function chapterCards(){return parts.map((part,index)=>{
  const group=chapters.filter(c=>c.part===part.id),ids=new Set(group.map(c=>c.id));
  const content=lessons.filter(l=>ids.has(l.chapter));
  return `<a class="chapter-card" href="#/course/${part.id}"><div class="chapter-number"><span>PART ${number(index)}</span><span aria-hidden="true">→</span></div><h3>${part.title}</h3><p>${part.description}</p><div class="card-progress" aria-hidden="true"><span style="width:${doneCount(content)/content.length*100}%"></span></div><div class="meta"><span>${group.length} chapters · ${content.length} lessons</span><span>${doneCount(content)}/${content.length} complete</span></div></a>`;
}).join('');}
function renderHome(){
  document.title='C++ Foundry · Learn by building';
  const next=lessons.find(l=>!done(l.id))||lessons[0];
  main.innerHTML=`<div class="container">
    <section class="hero"><div><h1>Learn C++20</h1><p class="lead">Start with one program that prints a greeting. Build up to resource ownership, algorithms and a record store. The first chapter assumes no C++ experience.</p><div class="actions"><a class="button" href="#/lesson/${next.id}">${doneCount(lessons)?'Continue learning':'Start the course'} <span aria-hidden="true">→</span></a></div><p class="hero-note">Most examples run in the browser. Lessons that require a native toolchain include terminal commands.</p></div><figure class="home-concept"><svg viewBox="0 0 540 310" role="img" aria-labelledby="home-concept-title home-concept-desc"><title id="home-concept-title">From C++ source to a greeting</title><desc id="home-concept-desc">The compiler translates the C++ source into a program. Running the program writes Hello, Ada! to Program output.</desc><g class="concept-box"><rect x="15" y="20" width="225" height="115" rx="12"/><rect x="300" y="20" width="225" height="115" rx="12"/><rect x="15" y="195" width="225" height="100" rx="12"/><rect x="300" y="195" width="225" height="100" rx="12"/></g><g class="concept-links" fill="none"><path d="M245 78h45m-10-7 10 7-10 7M412 145v40m-7-10 7 10 7-10M290 245h-40m10-7-10 7 10 7"/></g><g class="concept-text"><text x="32" y="52">C++ source</text><text x="32" y="93" class="concept-code">std::cout &lt;&lt;</text><text x="32" y="116" class="concept-code">"Hello, Ada!";</text><text x="320" y="52">Compiler</text><text x="320" y="93" class="concept-small">Translates the source</text><text x="320" y="230">Running program</text><text x="320" y="266" class="concept-small">Writes the greeting</text><text x="32" y="230">Program output</text><text x="32" y="266" class="concept-code">Hello, Ada!</text></g></svg><figcaption>The first lesson follows a greeting from C++ source to program output. Browser examples compile and run on your device.</figcaption></figure></section>
    <section class="course-prerequisites" aria-labelledby="prerequisites-heading"><div class="section-heading"><h2 id="prerequisites-heading">Before you start</h2><p>The first chapter starts from scratch. Follow the course in order; later lessons link to the earlier material they use.</p></div><dl class="prerequisites-list">
      <div><dt>No programming background needed</dt><dd>You do not need previous programming, C or C++ experience. Basic arithmetic and comfort typing and editing text are enough to begin.</dd></div>
      <div><dt>A browser and internet access</dt><dd>Use an up-to-date browser; Chrome is the tested option. Internet access is needed on your first visit. Use <strong>App status</strong> to save the complete course and compiler before going offline. A laptop or desktop keyboard makes code editing easier.</dd></div>
      <div><dt>No installation to get started</dt><dd>The browser examples run on this page. You do not need to install a compiler or create an account for these lessons.</dd></div>
      <div><dt>A native toolchain later</dt><dd>Lessons marked Native terminal need a compatible C++20 compiler and standard library, locally or in GitHub Codespaces. You can arrange this when you reach them. Codespaces requires a GitHub account. <a href="https://github.com/snowch/cpp-foundry#local-development-and-native-programs">Native setup details →</a></dd></div>
    </dl></section>
    <section><div class="section-heading"><h2>Course parts</h2><p>Open a part to see its chapters and examples.</p></div><div class="chapter-grid">${chapterCards()}</div></section>
    <section class="capstone-callout"><div><h2>Record-store Workbench</h2><p>Run the complete program, change a record and reopen the saved file.</p></div><a class="button secondary" href="#/workbench">Open Workbench <span aria-hidden="true">→</span></a></section></div>`;
}
function renderCourse(selected){
  document.title='Course · C++ Foundry';
  const visible=parts.some(p=>p.id===selected)?parts.filter(p=>p.id===selected):parts;
  const next=lessons.find(lesson=>!done(lesson.id))||lessons[0];
  main.innerHTML=`<div class="container course-page">
    <section class="page-top course-intro"><div><h1>C++20 curriculum</h1><p>Start here if you are new to C++. Each lesson lists any earlier lesson you need and how to run its example.</p></div><div class="continue-card">${progress()}<a class="button" href="#/lesson/${next.id}">${doneCount(lessons)?'Continue learning':'Start learning'} <span aria-hidden="true">→</span></a></div></section>
    <div class="course-filter"><label for="course-part-select">Explore a part</label><select id="course-part-select" class="course-select"><option value="" ${visible.length===parts.length?'selected':''}>All parts · ${chapters.length} chapters</option>${parts.map((part,index)=>`<option value="${part.id}" ${selected===part.id?'selected':''}>${number(index)} · ${part.title}</option>`).join('')}</select></div>
    <div class="course-layout"><aside class="course-sidebar"><nav class="part-links" aria-label="Course parts"><a href="#/course" ${visible.length===parts.length?'aria-current="page"':''}><span class="part-link-number">✦</span><span>All parts</span></a>${parts.map((part,index)=>`<a href="#/course/${part.id}" ${selected===part.id?'aria-current="page"':''}><span class="part-link-number">${number(index)}</span><span>${part.title}</span></a>`).join('')}</nav></aside><div class="course-sections">${visible.map(part=>`<section class="course-part"><div class="part-heading"><div><h2>${part.title}</h2><p>${part.description}</p></div></div>${chapters.filter(c=>c.part===part.id).map((chapter,index)=>{
      const content=lessons.filter(l=>l.chapter===chapter.id);
      return `<details class="outline-chapter" ${index===0?'open':''}><summary><span class="chapter-index">${number(chapters.indexOf(chapter))}</span><span class="chapter-summary"><h3>${chapter.title}</h3><span>${chapter.description}</span></span><span class="chapter-count">${content.length} lessons</span><span class="chapter-chevron" aria-hidden="true">⌄</span></summary><ol class="lesson-links">${content.map(l=>`<li><a href="#/lesson/${l.id}">${tick(l.id)}<span class="lesson-label">${l.title}</span>${l.native?'<span class="tag">Native terminal</span>':''}<span class="lesson-arrow" aria-hidden="true">→</span></a></li>`).join('')}</ol></details>`;
    }).join('')}</section>`).join('')}</div></div>
    <section class="capstone-callout"><div><h2>Record-store Workbench</h2><p>Run the complete program and inspect a saved file.</p></div><a href="#/workbench" class="button">Open Workbench →</a></section></div>`;
}
function contents(current){const group=chapters.find(c=>c.id===current.chapter).part;return `<aside class="contents"><button type="button" class="contents-toggle" aria-expanded="false" aria-controls="contents-body"><span>Course lessons</span><small>${doneCount(lessons)} / ${lessons.length} complete</small>${materialSymbol("expand_more")}</button><div class="contents-body" id="contents-body"><h2>In this course part</h2><a class="progress-label" href="#/course">${doneCount(lessons)}/${lessons.length} complete · all chapters</a><label class="part-label" for="part-select">Course part</label><select id="part-select" class="part-select" aria-label="Course part">${parts.map((part,index)=>`<option value="${part.id}" ${part.id===group?'selected':''}>${number(index)} · ${part.title}</option>`).join('')}</select>${chapters.filter(c=>c.part===group).map(chapter=>`<details ${chapter.id===current.chapter?'open':''}><summary>${number(chapters.indexOf(chapter))} · ${chapter.title}</summary><ol>${lessons.filter(l=>l.chapter===chapter.id).map(l=>`<li><a href="#/lesson/${l.id}" ${l.id===current.id?'aria-current="page"':''}>${done(l.id)?'✓ ':''}${l.title}</a></li>`).join('')}</ol></details>`).join('')}</div></aside>`;}
function renderLesson(lesson){
  const chapter=chapters.find(c=>c.id===lesson.chapter),index=lessons.indexOf(lesson),chapterLessons=lessons.filter(l=>l.chapter===chapter.id),part=parts.find(p=>p.id===chapter.part);
  document.title=lesson.title+' · C++ Foundry';
  const path=`native/examples/${lesson.id}.cpp`;
  const edit=edits[lesson.id];
  const editorName=lesson.native?`<code>${path}</code> in your checkout`:'the editable <code>main.cpp</code> below';
  const runAction=lesson.native?'rerun the terminal command below':'choose <strong>Run code</strong> again';
  main.innerHTML=`<div class="reading-layout"><div class="course-location">${contents(lesson)}<nav class="breadcrumbs" aria-label="Breadcrumb"><span aria-hidden="true">/</span> <a href="#/course/${part.id}">${part.title}</a> <span aria-hidden="true">/</span> <span aria-current="page">${lesson.title}</span></nav></div><article class="lesson-article"><p class="lesson-position">Lesson ${chapterLessons.indexOf(lesson)+1} of ${chapterLessons.length} in ${chapter.title}</p><h1>${lesson.title}</h1><div class="lesson-meta">${lesson.native?'Native investigation · C++20':'Runnable in your browser · C++20'}</div>${lesson.prerequisites?.length?`<p class="lesson-prerequisites">Read first: ${lesson.prerequisites.map(id=>`<a href="#/lesson/${id}">${escape(byId.get(id).title)}</a>`).join(', ')}</p>`:''}${lesson.introductions?.length?`<section class="lesson-foundations" aria-label="New terms and notation"><h2>New terms and notation</h2>${lesson.introductions.map(item=>`<p>${escape(item.text)}</p>`).join('')}</section>`:''}${lesson.body.map(p=>`<p>${escape(p)}</p>`).join('')}
    ${renderDiagram(lesson.id)}<section class="experiment" aria-labelledby="experiment-title"><h2 id="experiment-title">Run the starter, then try a change</h2>
      <ol><li>${lesson.native?`The checkout supplies <code>${path}</code>. From the repository root, enter the command below in a Linux or Codespaces terminal. It compiles and runs the starter in a fresh temporary directory.`:'The editor starts with the complete starter program unless it reopens a saved draft. For the original run, use <strong>Restore starter source</strong> in <strong>Editor tools</strong> if needed. Choose <strong>Run code</strong> and read <strong>Program output</strong>.'}</li>
      ${edit?`<li>In ${editorName}, replace ${edit.all?'both occurrences of ':''}<code>${escape(edit.before)}</code> with <code>${escape(edit.after)}</code>. Then ${runAction}.${edit.error?' This edit deliberately tests a compiler diagnostic.':''}</li><li>${escape(edit.observe)}</li>`:`<li>${escape(lesson.experiment)}</li>`}</ol></section>
    <label class="prediction-label" for="prediction">Your prediction (optional)</label><textarea id="prediction" class="prediction" rows="2" placeholder="What do you expect the starter or your edit to show?"></textarea><div id="lesson-editor"></div>
    <details class="disclosure"><summary>Original program output</summary><pre class="expected">${escape(lesson.expected)}</pre></details><p>${escape(lesson.walkthrough)}</p>
    <aside class="callout"><strong>Common mistake</strong>${escape(lesson.pitfall)}</aside>
    <section class="question"><h2>Check your understanding</h2><p>${escape(lesson.question)}</p><div class="choices">${lesson.choices.map((choice,i)=>`<button class="choice" data-choice="${i}" aria-pressed="false">${escape(choice)}</button>`).join('')}</div><div class="feedback" role="status"></div></section>
    ${lesson===chapterLessons.at(-1)?`<details class="disclosure"><summary>Optional chapter project</summary><p>${escape(chapter.project)}${chapter.id==='records'?' <a href="#/workbench">Open the Workbench →</a>':''}</p><p>Use your checkout for a project that spans multiple files. The lesson editor runs one source file.</p></details>`:''}
    ${referenceRow(lesson)}<label class="completion"><input id="completed" type="checkbox" ${done(lesson.id)?'checked':''}> Mark lesson complete <small>You can change this mark at any time.</small></label>
    <nav class="lesson-nav" aria-label="Lesson navigation">${index?`<a href="#/lesson/${lessons[index-1].id}"><small>← Previous</small>${lessons[index-1].title}</a>`:'<a href="#/course"><small>← Back</small>Course outline</a>'}${index<lessons.length-1?`<a href="#/lesson/${lessons[index+1].id}"><small>Next →</small>${lessons[index+1].title}</a>`:'<a href="#/workbench"><small>Build next →</small>Record-store Workbench</a>'}</nav></article></div>`;
  const prediction=document.querySelector('#prediction');prediction.value=read('prediction:'+lesson.id);prediction.oninput=()=>{if(!write('prediction:'+lesson.id,prediction.value))notice('Prediction kept in this tab. Browser storage could not save it.');};
  const target=document.querySelector('#lesson-editor');
  if(lesson.native){
    const command=nativeCommand(lesson);
    target.innerHTML=`<p>${escape(lesson.reason||'This experiment uses native threads.')} Run it in Codespaces or a terminal with a C++20 compiler.</p><pre class="native-command"><code>${escape(command)}</code></pre><details class="disclosure"><summary>Read the starter source in ${path}</summary><pre class="native-source">${escape(lesson.code)}</pre></details><div class="actions"><a class="button small" href="https://codespaces.new/snowch/cpp-foundry?quickstart=1" target="_blank" rel="noopener">Open Codespaces ↗</a><button class="button small secondary" id="copy-command">Copy command</button><a class="button small secondary" href="https://github.com/snowch/cpp-foundry/blob/main/native/examples/${lesson.id}.cpp">View source ↗</a></div><p class="progress-label">Codespaces uses your GitHub account’s compute and storage allowance.</p>`;
    document.querySelector('#copy-command').onclick=async()=>{
      try {await navigator.clipboard.writeText(command);notice('Command copied.');}
      catch {notice('Select and copy the terminal command above.');}
    };
  } else {
    const editor=mountEditor(target,{id:lesson.id,code:lesson.code,input:lesson.input||'',notice});registerReadingState(editor);dispose=()=>editor.dispose();
  }
  document.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-choice]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});
    button.classList.add('selected');button.setAttribute('aria-pressed','true');
    document.querySelector('.feedback').textContent=(Number(button.dataset.choice)===lesson.answer?'Correct. ':'Try again. ')+(Number(button.dataset.choice)===lesson.answer?lesson.feedback:'Review the worked example and choose another answer.');
  }));
  document.querySelector('#completed').addEventListener('change',event=>{
    const saved=write('done:'+lesson.id,event.target.checked?'1':'0');
    document.querySelector('.contents').outerHTML=contents(lesson);
    if(!saved)notice('Completion kept for this session. Browser storage could not save it.');
  });
}

async function renderWorkbench(token){
  document.title='Workbench · C++ Foundry';
  main.innerHTML=`<div class="container workbench"><div class="page-top"><h1>Record-store Workbench</h1><p>Run the editable C++ record store in your browser. The source starts with the course’s complete implementation. <strong>Program input</strong> is supplied all at once when a run begins.</p><ol class="workbench-steps"><li>To try the store, put <code>INSERT 1 "Ada" 90</code>, <code>LIST</code> and <code>SAVE</code> on separate input lines. For an existing ID, use <code>UPDATE 1 "Ada" 95</code> in place of <code>INSERT</code>.</li><li>Choose <strong>Run code</strong>. Compare the row printed by <code>LIST</code>, the <code>saved</code> count and the <strong>people.cpf</strong> file status. The <code>SAVE</code> command writes the run’s file. A successful run can then save those bytes in this browser.</li><li>Replace the input with <code>LIST</code> and run again. Does the same row reopen from the saved file?</li></ol></div><div class="workbench-layout"><div id="workbench-editor"><p>Loading source and saved file…</p></div><aside><h2>people.cpf</h2><div class="file-status" role="status">Opening browser storage…</div><div class="file-actions"><button id="download-db" class="button small secondary" disabled>Download file</button><button type="button" id="choose-import" class="button small secondary">Import file</button><input id="import-db" type="file" accept=".cpf,application/octet-stream" hidden></div><p>Import replaces the current database after validation. Downloads keep the exact CPF1 bytes.</p><h2>Commands</h2><pre class="command-help">INSERT 1 "Ada" 90
UPDATE 1 "Ada" 95
DELETE 1
LIST
COUNT
SAVE
LOAD</pre><p>Use uppercase commands and put names in quotation marks. IDs are whole numbers from 1 to 4,294,967,295. Scores range from 0 to 100. The store holds up to 1,000 rows.</p><p>SAVE writes a snapshot. Unsaved row changes last only for that run. Successful runs retain people.cpf in this browser; clearing site data removes it.</p><a href="#/lesson/row-model">Read the capstone lessons →</a><p><a href="record-store.cpp" download>Download original source</a></p></aside></div><p class="progress-label">This teaching store uses a map and writes a whole-file snapshot. It demonstrates reopening saved bytes. Creating or replacing the file does not test how a physical disk recovers after power loss.</p></div>`;
  let bytes=null,revision=0,available=true,unsaved=false;
  const status=document.querySelector('.file-status'),downloadButton=document.querySelector('#download-db'),importInput=document.querySelector('#import-db');
  function describe(message){status.textContent=message||(bytes?`${bytes.length.toLocaleString()} bytes · saved in this browser`:'No saved file yet. Use SAVE in the program input to create one.');downloadButton.disabled=!bytes;}
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
  registerReadingState({...editor,save(){if(unsaved)throw Error('The current database could not be saved. Download people.cpf before restarting.');editor.save();}});restoreReadingState();dispose=()=>editor.dispose();
  downloadButton.onclick=()=>{if(bytes)download('people.cpf',bytes);};
  document.querySelector('#choose-import').onclick=()=>importInput.click();
  importInput.onchange=async()=>{
    const file=importInput.files[0];if(!file)return;
    if(editor.root.dataset.busy==='true'){notice('Stop the running program before importing.');importInput.value='';return;}
    const runButton=editor.root.querySelector('.run');runButton.disabled=true;importInput.disabled=true;
    try {if(file.size>1048576)throw Error('Database is limited to 1 MB.');const candidate=new Uint8Array(await file.arrayBuffer());const count=validateDatabase(candidate);if(await save(candidate))notice(`Imported ${count} validated rows. Run LIST to inspect them.`);}
    catch(error){notice(`Import rejected: ${error.message}`);}finally{importInput.value='';importInput.disabled=false;runButton.disabled=false;}
  };
}
function render(){
  dispose();registerReadingState(null);dispose=()=>{};const token=++routeToken;
  const route=(location.hash||'#/').slice(1).split('/').filter(Boolean);
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===route[0]||(a.dataset.nav==='course'&&route[0]==='lesson'))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(!route.length)renderHome();
  else if(route[0]==='course')renderCourse(route[1]);
  else if(route[0]==='lesson'&&byId.has(route[1]))renderLesson(byId.get(route[1]));
  else if(route[0]==='workbench')renderWorkbench(token).catch(error=>notice(error.message));
  else {document.title='Page not found · C++ Foundry';main.innerHTML='<div class="container empty"><h1>That lesson could not be found.</h1><a href="#/course">Open the course outline →</a></div>';}
  window.scrollTo(0,0);restoreReadingState();
}
addEventListener('hashchange',render);
main.addEventListener('click',event=>{
  const toggle=event.target.closest('.contents-toggle');
  if(toggle){const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.closest('.contents').dataset.open=String(open);}
});
main.addEventListener('keydown',event=>{if(event.key==='Escape'){const contents=event.target.closest('.contents[data-open="true"]');if(contents){event.preventDefault();contents.dataset.open='false';const control=contents.querySelector('.contents-toggle');control.setAttribute('aria-expanded','false');control.focus();}}});
main.addEventListener('change',event=>{
  if(event.target.matches('#course-part-select'))location.hash='#/course'+(event.target.value?'/'+event.target.value:'');
  if(event.target.matches('.part-select')){const chapter=chapters.find(c=>c.part===event.target.value);const lesson=lessons.find(l=>l.chapter===chapter.id);location.hash='#/lesson/'+lesson.id;}
});
onStorage(key=>{
  if(!key.startsWith('done:'))return;
  const match=location.hash.match(/^#\/lesson\/([^/]+)/);
  if(match&&byId.has(match[1])){
    document.querySelector('#completed').checked=done(match[1]);document.querySelector('.contents').outerHTML=contents(byId.get(match[1]));
  }else if(!location.hash||location.hash==='#/'||location.hash.startsWith('#/course'))render();
});
render();

function referenceRow(lesson){
 const text=lesson.code+' '+lesson.body.join(' '),refs=[];
 const add=(label,url,note)=>refs.push(`<li><a href="${url}" target="_blank" rel="noopener">${label} (new tab)</a><p>${note}</p></li>`);
 if(/cout|cin|getline/.test(text))add('Input and output','https://en.cppreference.com/w/cpp/io.html','Look up std::cout, std::cin and stream operations used in this program.');
 if(/\bif\s*\(/.test(text))add('if statement','https://en.cppreference.com/w/cpp/language/if.html','Check which statements run when the condition is true or false.');
 if(/\bfor\s*\(/.test(text))add('for loops','https://en.cppreference.com/w/cpp/language/for.html','Check the initialization, condition and update in the loop.');
 if(/vector/.test(text))add('std::vector','https://en.cppreference.com/w/cpp/container/vector.html','Check element access, size and the operations used in this lesson.');
 if(/string/.test(text))add('std::string','https://en.cppreference.com/w/cpp/string/basic_string.html','Check how this program stores and changes text.');
 if(/unique_ptr|shared_ptr|make_unique/.test(text))add('Smart pointers','https://en.cppreference.com/w/cpp/memory.html','Check ownership and object lifetime for the pointer type used here.');
 if(/thread|mutex|atomic/.test(text))add('Concurrency support','https://en.cppreference.com/w/cpp/thread.html','Check the synchronization operation and its guarantees.');
 if(/throw|catch/.test(text))add('Exceptions','https://en.cppreference.com/w/cpp/language/exceptions.html','Check how a thrown exception reaches a matching catch handler.');
 if(!refs.length)add('C++ language reference','https://en.cppreference.com/w/cpp/language.html','Find the declarations and expressions introduced in this lesson.');
 return `<details class="resource-row"><summary>${materialSymbol('menu_book')}<span><strong>References</strong><small>C++ syntax and library operations used in this lesson</small></span>${materialSymbol('chevron_right')}</summary><div class="resource-body"><ul>${refs.join('')}</ul></div></details>`;
}
