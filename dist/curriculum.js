import {language} from './parts/language.js';
import {ownership} from './parts/ownership.js';
import {algorithms} from './parts/algorithms.js';
import {structures} from './parts/structures.js';
import {database} from './parts/database.js';
import {reliability} from './parts/reliability.js';
import {portability} from './parts/portability.js';
import {concurrency} from './parts/concurrency.js';
import {advanced} from './parts/advanced.js';

export const parts=[
  {id:'language',title:'Learn modern C++',description:'Values, control flow, interfaces, text, and the standard library.'},
  {id:'ownership',title:'Own resources and design types',description:'Lifetimes, move semantics, templates, polymorphism, and failures.'},
  {id:'algorithms',title:'Reason about algorithms',description:'Complexity, invariants, searching, sorting, and recursion.'},
  {id:'structures',title:'Build data structures',description:'Ownership-aware lists, hash tables, trees, heaps, and graphs.'},
  {id:'database',title:'Build the database',description:'Parsing, execution, byte formats, and page ownership.'},
  {id:'reliability',title:'Index, transact, and recover',description:'B+ trees, transaction state, redo logging, and query planning.'},
  {id:'portability',title:'Write portable C++',description:'Standards, numeric contracts, files, text, and storage audits.'},
  {id:'concurrency',title:'Coordinate concurrent work',description:'Threads, locks, atomics, queues, and storage ownership.'},
  {id:'advanced',title:'Extend the database',description:'Isolation, snapshots, joins, maintenance, and release contracts.'},
];
const syllabus=[
 ['language','values'],['language','control-flow','Decisions and loops','Make branch conditions, loop invariants, and termination visible.','Build a bounded command dispatcher and check all exit paths.'],
 ['language','functions-build','Functions and program boundaries','Design value-based interfaces and understand translation units.','Split a checked calculator into declarations, implementation, and a test caller.'],
 ['language','text-sequences','Text and sequences','Own, inspect, transform, and validate sequences.','Build a line-oriented report without borrowing from destroyed input.'],
 ['language','user-types','Design small domain types','Use initialization, enums, access control, and operators deliberately.','Design an ID type that cannot represent a missing record.'],
 ['language','standard-library','Use the standard library','Choose algorithms, containers, and result types by their contracts.','Replace hand-written collection plumbing while preserving independent checks.'],
 ['ownership','ownership'],['ownership','lifetimes-views','Lifetimes and borrowed views','Track owners, observers, invalidation, and temporary lifetimes.','Audit every borrowed reference in a record-search API.'],
 ['ownership','copy-move','Copying, moving, and value semantics','Understand generated operations and design exception-safe owners.','Implement an independently copied value type and test moving it.'],
 ['ownership','templates','Templates and generic interfaces','Deduce types, constrain operations, and distinguish compile-time choices.','Write a constrained, checked aggregation interface.'],
 ['ownership','polymorphism','Runtime and static polymorphism','Compare virtual dispatch, variants, and composition.','Add a storage interface without sharing ownership accidentally.'],['ownership','boundaries'],
 ['algorithms','algorithms'],['algorithms','complexity','Complexity and correctness','Count operations, state assumptions, and prove loop invariants.','Predict and check growth on absent-key search workloads.'],
 ['algorithms','searching','Searching and partition points','Implement scans, binary search, bounds, and indexed access.','Build a duplicate-aware sorted lookup API.'],
 ['algorithms','sorting-strategies','Sorting and algorithm strategies','Compare stable sorting, partitioning, merging, and selection.','Check sort properties against an independent reference.'],
 ['algorithms','recursion','Recursion and dynamic programming','Define base cases, progress measures, and reusable subproblems.','Compare recursive, memoized, and iterative implementations.'],
 ['structures','lists-queues','Lists, stacks, and queues','Keep structural ownership separate from borrowed links.','Build a queue with explicit empty/full behavior.'],
 ['structures','hashing','Hash tables and collisions','Implement bucket selection, probing, deletion, and resizing.','Check a bounded hash table against std::map.'],
 ['structures','balanced-trees','Search trees and balancing','Preserve ordering, ownership, and height through updates.','Validate a small AVL implementation after every operation.'],
 ['structures','heaps','Heaps and priority queues','Maintain a partial order for repeated minimum extraction.','Build a scheduler with deterministic tie-breaking.'],
 ['structures','graphs','Graphs and traversal','Represent adjacency and maintain visited/path state.','Implement reachability and shortest paths with independent fixtures.'],
 ['database','records'],['database','parsing-sql','Lexing and a SQL subset','Separate tokens, syntax, and validation before execution.','Parse a documented SELECT subset and reject trailing tokens.'],
 ['database','query-execution','Query execution operators','Compose scans, filters, projections, and bounded result production.','Build an explainable scan/filter/project pipeline.'],
 ['database','binary-codecs','Binary records and validation','Define byte contracts and preserve state on rejected imports.','Write a record codec with exact independent byte fixtures.'],
 ['database','pager-cache','Pages, guards, and caching','Own page buffers and define pin/dirty/eviction contracts.','Build a bounded page cache with scoped pin guards.'],
 ['reliability','bplus-tree','A bounded B+ tree','Implement leaf routing, splitting, borrowing, merging, and invariant checks.','Extend the bounded root/leaf index while retaining a reference-model oracle.'],
 ['reliability','transactions','Transaction state and commit','Keep tentative writes separate from committed state.','Add explicit begin/commit/rollback and stale-commit rejection.'],
 ['reliability','wal-recovery','Redo logging and recovery','Validate complete records and recover only committed work.','Enumerate crash prefixes and check recovery against a committed-state model.'],
 ['reliability','query-planning','Planning and access costs','Choose access paths using explicit statistics and assumptions.','Explain and compare scan and index plans for changing workloads.'],
 ['portability','cpp-standards','C++ standards and library contracts','Separate language versions, feature detection, and implementation choices.','Document the language, library, and host assumptions of your project.'],
 ['portability','numeric-boundaries','Numeric boundaries in depth','Check narrowing, arithmetic, floating values, and comparisons.','Build a boundary-focused numeric test table.'],
 ['portability','host-files-text','Files, text, and host boundaries','Distinguish byte formats, text conventions, names, and host behavior.','Exchange a documented fixture between two native hosts.'],
 ['portability','storage-audit','Audit the storage boundary','Turn portability assumptions and rejection rules into executable checks.','Audit the CPF1 capstone and record the limits of each host adapter.'],
 ['concurrency','engineering'],['concurrency','thread-coordination','Threads, queues, and shutdown','Coordinate ownership transfer and deterministic shutdown.','Build a draining producer/consumer queue with a close contract.'],
 ['concurrency','atomics-memory','Atomics and the memory model','Reason about atomic operations and happens-before relations.','Explain each edge in a single-publication protocol.'],
 ['concurrency','concurrent-storage','Concurrent storage ownership','Protect compound invariants and reject stale updates.','Implement a synchronized record store with a documented reader contract.'],
 ['advanced','isolation','Isolation and multi-client contracts','Model anomalies and distinguish isolation from durability.','Write schedules that expose and prevent lost updates.'],
 ['advanced','mvcc','Snapshots and version ownership','Choose visible versions and delay reclamation until readers finish.','Build a bounded version store with registered snapshots.'],
 ['advanced','joins-aggregates','Joins, grouping, and richer queries','Implement relational operators with explicit empty/duplicate behavior.','Add a join and grouped aggregate with independent expected rows.'],
 ['advanced','maintenance','Maintenance and checkpointing','Compact, checkpoint, and publish generations without invalidating readers.','Model generation replacement and old-reader retention.'],
 ['advanced','release','Reliability and release work','Test contracts, inject failures, benchmark honestly, and ship reproducibly.','Publish a reproducible release with a written failure model.'],
];

export function cpp(headers,main,support='') {
  return headers.split(/\s+/).filter(Boolean).map(header=>`#include <${header}>`).join('\n')+'\n\n'+(support?support+'\n\n':'')+'int main() {\n'+main+'\n}\n';
}
export function extend(chapters,lessons){
  for(const [part,id,title,description,project] of syllabus){
    const existing=chapters.find(chapter=>chapter.id===id);
    if(existing)existing.part=part;else chapters.push({part,id,title,description,project});
  }
  const add=(chapter,id,title,explanation,program,expected,walkthrough,pitfall,question,why,experiment,extra={})=>{
    const [prompt,correct,...wrong]=question;
    const answer=[...id].reduce((n,c)=>n+c.charCodeAt(0),0)%3;
    const choices=[...wrong];choices.splice(answer,0,correct);
    lessons.push({chapter,id,title,body:explanation.split('\n\n'),code:program,expected,walkthrough,pitfall,question:prompt,choices,answer,feedback:why,experiment,...extra});
  };
  for(const author of [language,ownership,algorithms,structures,database,reliability,portability,concurrency,advanced])author(add,cpp);
  chapters.sort((a,b)=>syllabus.findIndex(row=>row[1]===a.id)-syllabus.findIndex(row=>row[1]===b.id));
  lessons.sort((a,b)=>chapters.findIndex(c=>c.id===a.chapter)-chapters.findIndex(c=>c.id===b.chapter));
}
