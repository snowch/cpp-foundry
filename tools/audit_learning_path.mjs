import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parts,chapters,lessons,byId} from '../dist/course.js';
import {concepts} from '../dist/concept-catalog.js';
import {foundations} from '../dist/chapter-foundations.js';
const position=new Map(lessons.map((lesson,index)=>[lesson.id,index]));
const first=lessons.slice(0,8).map(lesson=>lesson.id);
assert.deepEqual(first,['first-program','numbers','text-values','decisions-basics','loop-basics','functions','collections','scope-basics']);
for(const id of ['first-program','numbers','functions']){
 const lesson=byId.get(id);
 assert.doesNotMatch(lesson.code,/optional|string|vector|numeric_limits|const\s+\w+\s*&/);
}
assert.doesNotMatch(JSON.stringify(byId.get('first-program')),/destructor|std::endl|flush|delete/);
assert.ok(position.get('references')<position.get('lib-vector-invalidation'));
assert.ok(position.get('forwarding')<position.get('lib-callable-ownership'));
const introduced=new Set();
for(const lesson of lessons){
 assert.ok(foundations[lesson.chapter],lesson.chapter);
 for(const prerequisite of lesson.prerequisites){
  assert.ok(byId.has(prerequisite),lesson.id+' unknown prerequisite');
  assert.ok(position.get(prerequisite)<position.get(lesson.id),lesson.id+' forward prerequisite '+prerequisite);
 }
 for(const item of lesson.introductions){
  assert.ok(concepts.some(concept=>concept.id===item.id));
  assert.ok(item.text.length>60);
  assert.ok(!introduced.has(item.id),item.id+' repeated first-use introduction');introduced.add(item.id);
 }
}
const lines=['# Learning-order audit','Reviewed 2026-11-15. This audit covers the ordered chapter entry points, all lesson prerequisite links, and a curated first-use vocabulary scan across every lesson’s prose, program, walkthrough, question, answers, feedback and experiment. It is not a proof that every sentence is understandable to every reader.',
'## Corrections',
'- Replaced the original first program with literal text output. It now explains #include, main, braces, semicolons, quoted text, std::cout, <<, newline, compilation and return 0 before asking a question about them. Removed premature ownership, destructor, caller and flush comparisons.',
'- Replaced the early numeric overflow/optional program with named integers and addition. Replaced the early optional average function with a single-input function. Replaced the reference-based string-vector loop with an integer vector loop explained by value.',
'- Added text, decisions, repetition and scope lessons. The first eight lessons now build one small step at a time, rather than using references, exceptions and optional results to introduce basic syntax.',
'- Moved the standard-library chapters after ownership, lifetime, template and polymorphism foundations. Existing lesson IDs and saved-work keys are retained; global chapter numbers change with the corrected sequence.',
'- Added chapter-specific entry explanations and earlier prerequisite links across all 54 chapters. Added point-of-use explanations of unfamiliar terms and notation; those explanations are rendered before the prose that uses them and exported with the readings.',
'## Scope and remaining judgment',
'The vocabulary catalogue is a review aid, not an automatic measure of teaching quality. Pattern matching can identify a word or source form without understanding the sentence. The chapter introductions and opening rewrites are authored teaching content; the tests check specific regressions and ordering, not pedagogical completeness. Some advanced examples remain substantial and should be worked through after their linked prerequisites. No claim is made that every possible implicit assumption has been eliminated.',
'## Chapter-by-chapter trace',
'| Part / chapter | Start after | First-use explanations added in this chapter |',
'| --- | --- | --- |'];
for(const chapter of chapters){
 const content=lessons.filter(lesson=>lesson.chapter===chapter.id);
 const prerequisites=content[0].prerequisites.map(id=>`[${byId.get(id).title}](../native/chapters/${byId.get(id).chapter}/README.md)`).join(', ')||'No prior C++ knowledge';
 lines.push(`| ${parts.find(part=>part.id===chapter.part).title} / ${chapter.title} | ${prerequisites} | ${content.flatMap(lesson=>lesson.introductions.map(item=>item.id)).join(', ')||'Builds on earlier explanations'} |`);
}
lines.push('## First-use lesson index',...lessons.filter(lesson=>lesson.introductions.length).map(lesson=>`- **${lesson.title}** (${lesson.id}): ${lesson.introductions.map(item=>item.id).join(', ')}.`));
fs.mkdirSync('docs',{recursive:true});
const report=lines.join('\n\n').replace(/\|\n\n\|/g,'|\n|')+'\n';
if(process.argv.includes('--write'))fs.writeFileSync('docs/learning-order-audit.md',report);
else assert.equal(fs.readFileSync('docs/learning-order-audit.md','utf8'),report,'Run npm run audit:learning to refresh the audit.');
console.log(`Checked all ${lessons.length} lessons and ${chapters.length} chapter foundations; ${introduced.size} first-use explanations; no forward prerequisites.`);
