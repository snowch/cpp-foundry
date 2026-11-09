import fs from 'node:fs';
import {lessons,chapters} from '../dist/course.js';
fs.mkdirSync('native/examples',{recursive:true});
for(const lesson of lessons) fs.writeFileSync(`native/examples/${lesson.id}.cpp`,lesson.code+'\n');
fs.writeFileSync('native/lessons.json',JSON.stringify(lessons.map(({id,expected,native,flags})=>({id,expected,native:!!native,flags:flags||''})),null,2)+'\n');
for(const chapter of chapters){
  const content=lessons.filter(l=>l.chapter===chapter.id);
  fs.mkdirSync(`native/chapters/${chapter.id}`,{recursive:true});
  fs.writeFileSync(`native/chapters/${chapter.id}/README.md`,[
    `# ${chapter.title}`,chapter.description,
    ...content.map(l=>`## ${l.title}\n\n${l.body.join('\n\n')}\n\n\`\`\`cpp\n${l.code}\n\`\`\`\n\nExpected output:\n\n\`\`\`text\n${l.expected}\n\`\`\`\n\n${l.walkthrough}\n\nPitfall: ${l.pitfall}\n\nQuestion: ${l.question}\n\n${l.choices.map((c,i)=>`${i+1}. ${c}`).join('\n')}\n\nAnswer: ${l.answer+1}. ${l.feedback}\n\nExperiment: ${l.experiment}`),
    `## Chapter project\n\n${chapter.project}`,
  ].join('\n\n')+'\n');
}
fs.copyFileSync('native/record-store.cpp','dist/record-store.cpp');
console.log(`Exported ${lessons.length} examples and ${chapters.length} chapter readings.`);
