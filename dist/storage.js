const memory = new Map();
const prefix = 'cpp-foundry:v1:';
export function read(key, fallback='') {
  if(memory.has(key)) return memory.get(key);
  try {return localStorage.getItem(prefix+key) ?? fallback;} catch {return fallback;}
}
export function write(key,value) {
  memory.set(key,value);
  try {localStorage.setItem(prefix+key,value);return true;} catch {return false;}
}
export function onStorage(callback) {
  addEventListener('storage',event=>{
    if(event.key?.startsWith(prefix)){
      const key=event.key.slice(prefix.length);memory.delete(key);callback(key);
    }
  });
}

let connection;
function open() {
  if(!connection) connection=new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(Error('Browser file storage is unavailable.'));return;}
    const request=indexedDB.open('cpp-foundry-files',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('files');
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(Error('Close other C++ Foundry tabs and reload to open browser storage.'));
    request.onsuccess=()=>resolve(request.result);
  });
  return connection;
}
export async function loadDatabase() {
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('files','readonly');
    const request=tx.objectStore('files').get('people.cpf');
    request.onsuccess=()=>resolve(request.result||{revision:0,bytes:null});
    request.onerror=()=>reject(request.error);
  });
}
export async function storeDatabase(bytes,expected) {
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('files','readwrite');
    const store=tx.objectStore('files');
    let failure;
    store.get('people.cpf').onsuccess=event=>{
      const current=event.target.result?.revision||0;
      if(current!==expected){failure=Error('Another tab saved a newer database. Your current file is available for download; reload before saving again.');tx.abort();return;}
      store.put({bytes:bytes ? new Uint8Array(bytes) : null,revision:current+1},'people.cpf');
    };
    tx.oncomplete=()=>resolve(expected+1);
    tx.onabort=tx.onerror=()=>reject(failure||tx.error||Error('Browser storage could not save the file.'));
  });
}

export function validateDatabase(data) {
  const bytes=new Uint8Array(data);
  if(bytes.length<8||bytes.length>1048576||String.fromCharCode(...bytes.slice(0,4))!=='CPF1') throw Error('Invalid CPF1 header.');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),ids=new Set();
  const count=view.getUint32(4,true);let at=8;
  if(count>1000) throw Error('CPF1 supports at most 1,000 rows.');
  const decoder=new TextDecoder('utf-8',{fatal:true});
  for(let i=0;i<count;i++){
    if(at+9>bytes.length) throw Error('Truncated CPF1 row.');
    const id=view.getUint32(at,true),score=view.getUint32(at+4,true),length=bytes[at+8];at+=9;
    if(!id||ids.has(id)||score>100||!length||length>63||at+length>bytes.length) throw Error('Invalid or duplicate CPF1 row.');
    const name=decoder.decode(bytes.subarray(at,at+length));
    if(/[\u0000-\u001f\u007f-\u009f]/u.test(name)) throw Error('CPF1 names cannot contain control characters.');
    ids.add(id);at+=length;
  }
  if(at!==bytes.length) throw Error('Trailing CPF1 bytes.');
  return count;
}
