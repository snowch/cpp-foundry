// Optional authoring aid: format C++ snippets in our trusted curriculum modules.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const executable=process.argv[2]||'clang-format';
const style='{BasedOnStyle: LLVM, IndentWidth: 4, ColumnLimit: 88, AllowShortIfStatementsOnASingleLine: Never, AllowShortLoopsOnASingleLine: false, AllowShortFunctionsOnASingleLine: None}';
let count=0;
for(const name of fs.readdirSync('dist/parts').filter(n=>n.endsWith('.js'))){
  const file=path.join('dist/parts',name),source=fs.readFileSync(file,'utf8');
  const result=source.replace(/'(?:\\[\s\S]|[^'\\])*'|"(?:\\[\s\S]|[^"\\])*"/g,literal=>{
    const value=Function('return ('+literal+')')();
    if(!value.includes(';')||!/^\s*(?:(?:std::|template\s*<|#ifndef)|(?:(?:const|auto|unsigned|int|bool|void|struct|class|using|enum)\b)|(?:for|if|while)\s*\(|(?:[A-Z]\w*(?:<[^\n]+?>)?[&*]?\s+[a-z_]\w*\s*[=;{(,]))/.test(value))return literal;
    const body=value.startsWith('    ');
    const input=body?'void cpp_foundry_format_body() {\n'+value+'\n}\n':value;
    let formatted=execFileSync(executable,['--assume-filename=lesson.cpp','--style='+style],{input,encoding:'utf8'});
    if(body){const match=formatted.match(/^void cpp_foundry_format_body\(\) \{\n([\s\S]*)\n\}\s*$/);if(!match)throw Error('Could not extract formatted body');formatted=match[1];}
    count++;return JSON.stringify(formatted.trimEnd());
  });
  fs.writeFileSync(file,result);
}
console.log(`Formatted ${count} authored C++ snippets.`);
