import fs from 'node:fs';
import {lessons,chapters,parts} from '../dist/course.js';
import {diagrams} from '../dist/diagrams.js';
import {edits,nativeCommand} from '../dist/experiment-edits.js';
import {diagramDescription,diagramSvg} from '../dist/diagram-view.js';
fs.mkdirSync('native/diagrams',{recursive:true});
for(const diagram of diagrams)fs.writeFileSync(`native/diagrams/${diagram.lesson}.svg`,diagramSvg(diagram)+'\n');
const experimentMarkdown=lesson=>{
  const edit=edits[lesson.id], path=`native/examples/${lesson.id}.cpp`;
  const codeBlock=(label,text)=>`${label}\n\n\`\`\`cpp\n${text}\n\`\`\``;
  const command=nativeCommand(lesson);
  return [`### Run the starter, then try a change\n\nOpen \`${path}\` in your checkout. From the repository root, use this command in a Linux or Codespaces terminal to compile and run the current file in a fresh temporary directory.\n\n\`\`\`sh\n${command}\n\`\`\``,
    codeBlock(edit.all?'Replace both occurrences of':'Replace',edit.before),
    codeBlock('With',edit.after),`Rerun the terminal command.${edit.error?' This edit deliberately tests a compiler diagnostic.':''} ${edit.observe}`].join('\n\n');
};
const diagramMarkdown=id=>{
  const diagram=diagrams.find(item=>item.lesson===id);
  return diagram?`\n\n![${diagram.title}](../../diagrams/${id}.svg)\n\n${diagram.caption}\n\nText description: ${diagramDescription(diagram)}`:'';
};
fs.mkdirSync('native/examples',{recursive:true});
for(const lesson of lessons) fs.writeFileSync(`native/examples/${lesson.id}.cpp`,lesson.code.trimEnd()+'\n');
fs.writeFileSync('native/lessons.json',JSON.stringify(lessons.map(({id,chapter,expected,native,flags,input})=>({id,chapter,expected,native:!!native,flags:flags||'',input:input||''})),null,2)+'\n');
fs.writeFileSync('native/course.json',JSON.stringify({parts,chapters},null,2)+'\n');
for(const chapter of chapters){
  const content=lessons.filter(l=>l.chapter===chapter.id);
  fs.mkdirSync(`native/chapters/${chapter.id}`,{recursive:true});
  fs.writeFileSync(`native/chapters/${chapter.id}/README.md`,[
    `# ${chapter.title}`,chapter.description,
    ...content.map(l=>`## ${l.title}\n\n${l.prerequisites?.length?'Before this chapter: '+l.prerequisites.map(id=>`[${lessons.find(item=>item.id===id).title}](../${lessons.find(item=>item.id===id).chapter}/README.md)`).join(', ')+'\n\n':''}${l.introductions?.length?'New terms and notation:\n\n'+l.introductions.map(item=>item.text).join('\n\n')+'\n\n':''}${l.body.join('\n\n')}${diagramMarkdown(l.id)}\n\n\`\`\`cpp\n${l.code}\n\`\`\`\n\nOriginal program output:\n\n\`\`\`text\n${l.expected}\n\`\`\`\n\n${l.walkthrough}\n\nPitfall: ${l.pitfall}\n\nQuestion: ${l.question}\n\n${l.choices.map((c,i)=>`${i+1}. ${c}`).join('\n')}\n\nAnswer: ${l.answer+1}. ${l.feedback}\n\n${experimentMarkdown(l)}`),
    `## Chapter project\n\n${chapter.project}`,
  ].join('\n\n')+'\n');
}
fs.copyFileSync('native/record-store.cpp','dist/record-store.cpp');
console.log(`Exported ${lessons.length} examples and ${chapters.length} chapter readings.`);
