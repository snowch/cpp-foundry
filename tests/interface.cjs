const {chromium}=require('playwright');
const {start}=require('./server.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
  const {server,url}=await start();
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
  fs.mkdirSync('test-results',{recursive:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem('cpp-foundry:runner-intro:1','1'));await page.goto(url);
    await page.locator('.hero').waitFor();
    assert.equal(await page.locator('.foundry-lab-card').count(),10);
    await page.screenshot({path:'test-results/home-desktop.png',fullPage:true});
    await page.locator('nav [data-nav=course]').click();
    await page.locator('.outline-chapter').first().waitFor();
    const lessons=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../native/lessons.json'),'utf8'));
    assert.equal(await page.locator('.outline-chapter').count(),54);
    assert.equal(await page.locator('.course-part').count(),10);
    assert.equal(await page.locator('.lesson-links li').count(),lessons.length);
    assert.equal(await page.locator('.lesson-links .tag').count(),lessons.filter(l=>l.native).length);
    const chapter=page.locator('.outline-chapter').nth(1);
    assert.equal(await chapter.getAttribute('open'),null);
    await chapter.locator('summary').click();
    assert.equal(await chapter.locator('.lesson-links a').first().isVisible(),true);
    await chapter.locator('summary').click();
    assert.equal(await chapter.locator('.lesson-links a').first().isVisible(),false);
    for(const lesson of lessons){
      await page.goto(url+'#/lesson/'+lesson.id);
      await page.waitForFunction(id=>document.querySelector('.contents [aria-current="page"]')?.getAttribute('href')==='#/lesson/'+id,lesson.id);
      await page.locator('.lesson-article').waitFor();
      assert.equal(await page.locator('.choices button').count(),3);
      assert.ok((await page.locator('.experiment').innerText()).length>60);
      if(lesson.native){assert.equal(await page.locator('.editor').count(),0);assert.ok(await page.locator('.native-command').innerText());}
      else assert.ok((await page.locator('.source').inputValue()).includes('int main'));
    }
    console.log(`PASS all ${lessons.length} routes, readings, questions, experiments, native/browser controls`);
    await page.goto(url+'#/lesson/bplus-routing');await page.locator('.contents-toggle').click();await page.locator('#part-select').waitFor();
    assert.equal(await page.locator('#part-select').inputValue(),'reliability');
    await page.locator('#part-select').selectOption('advanced');
    await page.waitForFunction(()=>location.hash==='#/lesson/lost-update-schedule'&&document.querySelector('#part-select')?.value==='advanced');
    await page.goto(url+'#/course/reliability');await page.waitForFunction(()=>document.querySelectorAll('.course-part').length===1);
    assert.equal(await page.locator('.outline-chapter').count(),4);
    assert.equal(await page.locator('.lesson-links li').count(),29);
    console.log('PASS part selector and filtered course navigation');
    await page.setViewportSize({width:390,height:844});
    await page.goto(url+'#/course');await page.locator('#course-part-select').waitFor();
    assert.equal(await page.locator('.part-links').isVisible(),false);
    assert.equal(await page.locator('#course-part-select option').count(),11);
    await page.screenshot({path:'test-results/course-mobile.png',fullPage:false});
    await page.locator('#course-part-select').selectOption('advanced');
    await page.waitForFunction(()=>location.hash==='#/course/advanced'&&document.querySelectorAll('.course-part').length===1);
    assert.equal(await page.locator('.outline-chapter').count(),5);
    assert.equal(await page.locator('.lesson-links li').count(),25);
    await page.reload();await page.locator('#course-part-select').waitFor();
    assert.equal(await page.locator('#course-part-select').inputValue(),'advanced');
    await page.locator('#course-part-select').selectOption('');
    await page.waitForFunction(()=>location.hash==='#/course'&&document.querySelectorAll('.course-part').length===10);
    await page.goto(url+'#/lesson/first-program');await page.locator('.lesson-nav').waitFor();
    assert.equal(await page.locator('.contents-body').isVisible(),false);
    await page.locator('.contents-toggle').click();
    assert.equal(await page.locator('.contents-toggle').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#part-select').isVisible(),true);
    await page.locator('.contents-toggle').click();
    assert.equal(await page.locator('.contents-body').isVisible(),false);
    assert.equal(await page.locator('.lesson-nav a').last().isVisible(),true);
    await page.setViewportSize({width:1440,height:1050});
    console.log('PASS mobile course selector includes all ten parts, restores filters, and retains next-lesson link');
    await page.goto(url+'#/lesson/first-program');
    await page.locator('.source').waitFor();
    await page.locator('[data-choice="0"]').click();
    assert.match(await page.locator('.feedback').innerText(),/^Correct/);
    await page.locator('#completed').check();
    await page.reload();await page.locator('#completed').waitFor();
    assert.equal(await page.locator('#completed').isChecked(),true);
    const other=await context.newPage();await other.goto(url+'#/lesson/first-program');
    await other.locator('#completed').uncheck();
    await page.waitForFunction(()=>!document.querySelector('#completed').checked);
    await other.close();
    const source=page.locator('.source');
    await source.fill('#include <iostream>\nint main(){ std::cout << "editable"; }');
    await source.dispatchEvent('input');
    await page.reload();await page.locator('.source').waitFor();
    assert.match(await source.inputValue(),/editable/);
    const run=async()=>{
      await page.locator('.run').click();
      await page.waitForFunction(()=>document.querySelector('.editor')?.dataset.busy==='false',{}, {timeout:120000});
      return page.locator('.output').innerText();
    };
    assert.equal(await run(),'editable');
    assert.match(await page.locator('.status').innerText(),/exit 0/);
    const blocked=[];
    await context.route('**/*',route=>{blocked.push(route.request().url());return route.abort();});
    await source.fill('#include <iostream>\nint main(){ std::cout << "offline edit"; }');
    assert.match(await page.locator('.output-context').innerText(),/earlier source or input/);
    assert.equal(await page.locator('.output').innerText(),'editable');
    assert.equal(await run(),'offline edit');assert.deepEqual(blocked,[]);
    await source.fill('int main(){missing_name;}');
    assert.equal(await run(),'offline edit');
    assert.match(await page.locator('.run-diagnostic').innerText(),/missing_name/);
    assert.match(await page.locator('.output-context').innerText(),/last program that ran/);
    await context.unroute('**/*');
    await source.fill('int main(){for(;;){}}');await page.locator('.run').click();
    await page.waitForFunction(()=>document.querySelector('.status').textContent==='Running…');
    await page.locator('.stop').click();assert.match(await page.locator('.status').innerText(),/Stopped/);
    await source.fill('int main(){return 0;}');assert.equal(await run(),'(no output)');
    await source.fill('int main(){for(;;){}}');await run();
    assert.match(await page.locator('.status').innerText(),/stopped after five seconds/);
    await source.fill('int main(){return 0;}');assert.equal(await run(),'(no output)');
    console.log('PASS question feedback, completion persistence/tabs, draft persistence, offline compilation, Stop/recovery');
    await page.locator('.editor-tools summary').click();
    await page.locator('.reset').click();
    assert.match(await source.inputValue(),/Hello/);
    await page.screenshot({path:'test-results/lesson-desktop.png',fullPage:true});

    await page.goto(url+'#/workbench');await page.locator('.source').waitFor();
    let text=await run();assert.match(text,/saved 2/);
    await page.waitForFunction(()=>document.querySelector('.file-status').textContent.includes('saved in this browser'));
    await page.reload();await page.locator('.source').waitFor();
    await page.locator('.stdin').fill('LIST\n');text=await run();
    assert.equal(text,'1 "Ada" 90\n2 "Grace" 95\nrows=2');
    let downloadPromise=page.waitForEvent('download');await page.locator('#download-db').click();
    const downloaded=await downloadPromise;
    const bytes=fs.readFileSync(await downloaded.path());
    const expected=Buffer.from('4350463102000000010000005a00000003416461020000005f000000054772616365','hex');
    assert.deepEqual(bytes,expected);
    await page.locator('#import-db').setInputFiles({name:'broken.cpf',mimeType:'application/octet-stream',buffer:bytes.subarray(0,-1)});
    await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('Import rejected'));
    assert.equal(await run(),'1 "Ada" 90\n2 "Grace" 95\nrows=2');
    console.log('PASS Workbench persistence after reload, exact-byte download, corrupt-import preservation');

    const second=await context.newPage();await second.goto(url+'#/workbench');await second.locator('.source').waitFor();
    await second.locator('.stdin').fill('UPDATE 1 "Newest" 99\nSAVE\n');
    await second.locator('.run').click();
    await second.waitForFunction(()=>document.querySelector('.editor').dataset.busy==='false',{}, {timeout:120000});
    await page.locator('.stdin').fill('UPDATE 2 "Stale" 80\nSAVE\n');await run();
    assert.match(await page.locator('.file-status').innerText(),/Unsaved/);
    assert.match(await page.locator('#notice').innerText(),/Another tab saved/);
    await page.reload();await page.locator('.source').waitFor();
    await page.locator('.stdin').fill('LIST\n');assert.equal(await run(),'1 "Newest" 99\n2 "Grace" 95\nrows=2');
    await second.close();
    await page.screenshot({path:'test-results/workbench-desktop.png',fullPage:true});
    console.log('PASS stale tab cannot overwrite a newer saved database');

    for(const width of [320,390,480,768,1024]){
      await page.setViewportSize({width,height:900});
      for(const route of ['#/','#/course','#/lesson/concepts','#/lesson/threads','#/workbench']){
        await page.goto(url+route);
        if(route==='#/workbench')await page.locator('.source').waitFor();else await page.locator('main h1').waitFor();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width} ${route}`);
        if(route==='#/course'){
          if(width<=780)assert.equal(await page.locator('#course-part-select').isVisible(),true);
          else assert.equal(await page.locator('.part-links a').last().isVisible(),true);
        }
      }
      await page.screenshot({path:`test-results/workbench-${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);
    const fallback=await browser.newContext();
    await fallback.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}}));
    const fallbackPage=await fallback.newPage();await fallbackPage.goto(url+'#/lesson/first-program');
    await fallbackPage.locator('#completed').check();
    assert.match(await fallbackPage.locator('#notice').innerText(),/session/);
    await fallback.close();
    const limited=await browser.newContext();
    await limited.addInitScript(()=>{
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){
        const blocked=sessionStorage.getItem('quota-target');
        if(this===localStorage&&blocked&&key==='cpp-foundry:v1:'+blocked+':first-program')
          throw new DOMException('rehearsed quota','QuotaExceededError');
        return original.call(this,key,value);
      };
    });
    const limitedPage=await limited.newPage();
    await limitedPage.goto(url+'#/lesson/first-program');
    const longDraft='#include <iostream>\nint main(){std::cout<<"Only durable source";}\n';
    await limitedPage.locator('.source').fill(longDraft);
    await limitedPage.evaluate(()=>sessionStorage.setItem('quota-target','restore'));
    await limitedPage.locator('.editor-tools summary').click();
    await limitedPage.locator('.reset').click();
    await limitedPage.locator('.source-save-warning').waitFor();
    const retained=()=>limitedPage.evaluate(()=>localStorage.getItem('cpp-foundry:v1:draft:first-program'));
    assert.equal(await retained(),longDraft);
    await limitedPage.reload();
    assert.equal(await limitedPage.locator('.source').inputValue(),longDraft);
    await limitedPage.evaluate(()=>sessionStorage.removeItem('quota-target'));
    await limitedPage.locator('.editor-tools summary').click();
    await limitedPage.locator('.reset').click();
    await limitedPage.evaluate(()=>sessionStorage.setItem('quota-target','draft'));
    await limitedPage.locator('.undo').click();
    assert.equal(await limitedPage.locator('.source').inputValue(),longDraft);
    assert.equal(await limitedPage.evaluate(()=>localStorage.getItem('cpp-foundry:v1:restore:first-program')),longDraft);
    await limited.close();
    console.log('PASS responsive layouts, quota-safe source restore and undo, and no page errors');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
