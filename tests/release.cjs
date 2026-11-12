const {chromium}=require('playwright');
const {start}=require('./server.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
  // The release test deliberately serves the built site even during source tests.
  require('node:child_process').execFileSync(process.execPath,['tools/build.mjs'],{stdio:'inherit'});
  const {server,url}=await start({root:'.build/site'});
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
  try{
    const page=await browser.newPage(),unversioned=[],errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // Model a returning browser whose original application files are still cached.
    await page.route(/\.(js|css|cpp)$/,route=>{
      const pathname=new URL(route.request().url()).pathname;
      if(!/\.[a-f0-9]{16}\.(js|css|cpp)$/.test(pathname)){
        unversioned.push(pathname);
        return route.fulfill({contentType:'text/javascript',body:'throw Error("Stale cached starter");'});
      }
      return route.continue();
    });
    await page.goto(url);await page.locator('.hero').waitFor();
    assert.equal(await page.locator('.chapter-card').count(),9);
    await page.goto(url+'#/course');await page.locator('.outline-chapter').first().waitFor();
    assert.equal(await page.locator('.outline-chapter').count(),54);
    assert.equal(await page.locator('.lesson-links li').count(),266);
    await page.goto(url+'#/workbench');await page.locator('.source').waitFor();
    assert.match(await page.locator('.source').inputValue(),/int main/);
    await page.locator('.source').fill('#include <iostream>\nint main(){std::cout<<"fresh release";}');
    await page.locator('.run').click();
    await page.waitForFunction(()=>document.querySelector('.editor').dataset.busy==='false',{}, {timeout:120000});
    assert.equal(await page.locator('.output').innerText(),'fresh release');
    assert.deepEqual(unversioned,[]);assert.deepEqual(errors,[]);
    console.log('PASS versioned release ignores stale application cache, loads all 266 lessons and compiles through versioned worker');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
