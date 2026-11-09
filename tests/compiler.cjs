const {chromium}=require('playwright');
const {start}=require('./server.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
  const {server,url}=await start();
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),headless:true,args:['--no-sandbox']});
  try {
    const page=await browser.newPage();await page.goto(url);
    await page.evaluate(()=>{window.compiler=new Worker('./compiler/worker.js');});
    const lessons=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../native/lessons.json'),'utf8'));
    const run=data=>page.evaluate(data=>new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Compiler timeout')),120000);
      window.compiler.onmessage=({data})=>{if(data.type==='stage')return;clearTimeout(timer);resolve({...data,database:data.database?Array.from(data.database):null});};
      window.compiler.postMessage(data);
    }),data);
    for(const lesson of lessons.filter(l=>!l.native)){
      const code=fs.readFileSync(path.resolve(__dirname,`../native/examples/${lesson.id}.cpp`),'utf8');
      const result=await run({code});
      assert.equal(result.type,'done',JSON.stringify({id:lesson.id,...result}));
      assert.equal(result.exitCode,0);assert.equal(result.output,lesson.expected.trim(),lesson.id);
      assert.equal(result.diagnostics,'',lesson.id);console.log('PASS browser '+lesson.id);
    }
    let result=await run({code:'int main(){ invalid_cpp; }'});
    assert.equal(result.type,'error');assert.match(result.diagnostics,/undeclared identifier/);
    result=await run({code:'int main(){return 7;}'});assert.equal(result.exitCode,7);
    result=await run({code:'#include <iostream>\n#include <string>\nint main(){std::string s;std::getline(std::cin,s);std::cout<<s;}',input:'Zoë 中文\n'});
    assert.equal(result.output,'Zoë 中文');console.log('PASS diagnostics, nonzero exit, UTF-8 stdin/output');
    result=await run({code:'#include <iostream>\nint main(){for(int i=0;i<100001;++i)std::cout<<"x";}'});
    assert.equal(result.type,'error');assert.match(result.message,/Output limit/);assert.ok(result.output.length<=100000);
    console.log('PASS output is bounded');
    const code=fs.readFileSync(path.resolve(__dirname,'../native/record-store.cpp'),'utf8');
    result=await run({code,persistent:true,input:'INSERT 1 "Ada" 90\nINSERT 2 "Zoë" 95\nSAVE\n'});
    assert.equal(result.type,'done',JSON.stringify(result));assert.equal(result.exitCode,0);assert.ok(result.database);
    const database=result.database;
    assert.deepEqual(database.slice(0,8),[67,80,70,49,2,0,0,0]);
    result=await run({code,persistent:true,database,input:'LIST\nINSERT 1 "Wrong" 0\nSAVE\n'});
    assert.equal(result.output,'1 "Ada" 90\n2 "Zoë" 95\nrows=2\nerror: duplicate ID\nsaved 2');
    assert.deepEqual(result.database,database);
    result=await run({code,persistent:true,database,input:'UPDATE 1 "Grace" 99\nDELETE 2\nSAVE\nLOAD\nLIST\n'});
    assert.equal(result.output,'updated 1\ndeleted 2\nsaved 1\nloaded 1\n1 "Grace" 99\nrows=1');
    const corrupt=database.slice(0,-1);
    result=await run({code,persistent:true,database:corrupt,input:'SAVE\n'});
    assert.equal(result.exitCode,1);assert.equal(result.database,null);
    console.log('PASS browser capstone save/reopen, duplicate preservation, update/delete, UTF-8, corrupt import');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
