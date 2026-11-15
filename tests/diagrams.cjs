const {chromium}=require('playwright');
const {start}=require('./server.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {diagrams}=await import('../dist/diagrams.js');
 const {byId}=await import('../dist/course.js');
 assert.equal(new Set(diagrams.map(d=>d.lesson)).size,diagrams.length);
 assert.equal(diagrams.length,34);
 for(const diagram of diagrams){
  assert.ok(byId.has(diagram.lesson),diagram.lesson);
  const ids=new Set(diagram.nodes.map(n=>n.id));assert.equal(ids.size,diagram.nodes.length);
  for(const edge of diagram.edges){assert.ok(ids.has(edge.source));assert.ok(ids.has(edge.target));}
  assert.ok(diagram.caption.length>80);
  const svg=fs.readFileSync(`native/diagrams/${diagram.lesson}.svg`,'utf8');
  assert.ok(svg.includes('<title'));assert.ok(svg.includes('<desc'));assert.ok(!/https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg','')));
  assert.ok(fs.readFileSync(`native/chapters/${byId.get(diagram.lesson).chapter}/README.md`,'utf8').includes(`../../diagrams/${diagram.lesson}.svg`));
 }
 const {server,url}=await start();
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('test-results',{recursive:true});
  for(const width of [320,390,1024]){
   await page.setViewportSize({width,height:900});
   for(const diagram of diagrams){
    await page.goto(url+'#/lesson/'+diagram.lesson);
    await page.locator('.concept-diagram').waitFor();
    assert.equal(await page.locator('.concept-diagram svg[role=img]').count(),1);
    assert.equal(await page.locator('.concept-diagram title').textContent(),diagram.title);
    const failures=await page.locator('.concept-diagram svg').evaluate(svg=>{
     const failures=[];
     for(const group of svg.querySelectorAll('g')){
      const rect=group.querySelector('rect').getBBox();
      for(const text of group.querySelectorAll('text')){
       const box=text.getBBox();
       if(box.x<rect.x+3||box.x+box.width>rect.x+rect.width-3||box.y<rect.y+3||box.y+box.height>rect.y+rect.height-3)failures.push(text.textContent);
      }
     }
     return failures;
    });
    assert.deepEqual(failures,[],`${diagram.lesson} at ${width}px`);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${diagram.lesson} at ${width}px`);
    await page.locator('.diagram-description summary').click();
    assert.ok((await page.locator('.diagram-description p').innerText()).includes('→'));
    if(['observer-owner','tree-ordering','lib-lazy-views'].includes(diagram.lesson))await page.locator('.concept-diagram').screenshot({path:`test-results/diagram-${diagram.lesson}-${width}.png`});
   }
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS ${diagrams.length} original diagrams: lesson links, exports, accessibility, label bounds and 320/390/1024px layouts`);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
