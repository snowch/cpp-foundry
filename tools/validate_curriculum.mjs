import assert from 'node:assert/strict';
import {parts,chapters,lessons,byId} from '../dist/course.js';
assert.equal(parts.length,9);assert.equal(chapters.length,44);assert.equal(lessons.length,226);
assert.equal(new Set(chapters.map(c=>c.id)).size,chapters.length);
assert.equal(byId.size,lessons.length);
for(const part of parts)assert.ok(chapters.some(c=>c.part===part.id),part.id);
for(const chapter of chapters){
  assert.ok(parts.some(p=>p.id===chapter.part),chapter.id);
  const topics=lessons.filter(l=>l.chapter===chapter.id);
  assert.ok(topics.length>=4&&topics.length<=8,chapter.id);
  for(const field of ['title','description','project'])assert.ok(chapter[field]?.length>8,chapter.id+' '+field);
}
for(const lesson of lessons){
  assert.ok(chapters.some(c=>c.id===lesson.chapter),lesson.id);
  for(const field of ['title','code','walkthrough','pitfall','question','feedback','experiment'])assert.ok(typeof lesson[field]==='string'&&lesson[field].length>8,lesson.id+' '+field);
  assert.ok(lesson.body.join(' ').length>150,lesson.id+' body');
  assert.equal(lesson.choices.length,3,lesson.id);assert.ok(lesson.answer>=0&&lesson.answer<3,lesson.id);
  assert.ok(typeof lesson.expected==='string',lesson.id);assert.match(lesson.code,/int main\(/,lesson.id);
}
console.log('Validated '+parts.length+' parts, '+chapters.length+' populated chapters, and '+lessons.length+' complete lessons.');
