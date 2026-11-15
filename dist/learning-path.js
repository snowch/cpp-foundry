import {concepts} from './concept-catalog.js';
import {foundations} from './chapter-foundations.js';
// Teaching order and first-use explanations are part of the curriculum, not UI hints.
export function prepareLearningPath(chapters,lessons){
 const program=(headers,body)=>headers.map(h=>`#include <${h}>`).join('\n')+'\n\n'+body+'\n';
 const introduce=(id,title,body,code,expected,walkthrough,pitfall,question,choices,experiment)=>lessons.push({chapter:'values',id,title,body,code,expected,walkthrough,pitfall,question,choices,answer:0,feedback:choices[0]+'. '+walkthrough,experiment});
 introduce('text-values','Give text a name',[
  'A string is a value containing a sequence of characters, such as a person’s name. std::string is the standard-library type used here, made available by #include <string>. The std:: prefix identifies a name supplied by C++’s standard library. Keep the two colons together.',
  'std::string name = "Ada"; creates a variable named name with the text Ada. name = "Grace"; later replaces its value. A quoted literal is fixed text in the source; a string variable gives text a name so it can be read and changed while the program runs. We do not need to manage the storage for these ordinary variables.',
  'Several << operations in one output instruction send several pieces to the same destination, from left to right. In the last instruction below, one piece is quoted text, one is the current value of name, and the last is a line break.'
 ],program(['iostream','string'],'int main() {\n    std::string name = "Ada";\n    std::cout << name << "\\n";\n    name = "Grace";\n    std::cout << "Hello, " << name << "!\\n";\n    return 0;\n}'),'Ada\nHello, Grace!','The first output uses the starting value Ada. Assignment replaces it with Grace before the second output instruction reads it.','A name such as Name is different from name: C++ distinguishes uppercase and lowercase letters. A quoted "name" prints the word instead of reading the variable.','Which instruction replaces the stored text?',['name = "Grace";','std::cout << name;','#include <string>'],'Change both names, then print name twice before replacing it. Explain which output instructions read the earlier value and which read the later value.');
 introduce('decisions-basics','Choose which instructions run',[
  'A condition is a question whose answer is true or false. The comparison score >= 60 asks whether score is at least 60. The >= symbol includes equality. Use > for strictly greater than and == for equal to. bool is the C++ type for these two possible answers.',
  'An if statement runs its first group of instructions when the condition in parentheses is true. An else group runs when that condition is false. Braces keep the instructions for each choice together. Only one of these two groups runs on a single visit to this statement.'
 ],program(['iostream'],'int main() {\n    int score = 60;\n    if (score >= 60) {\n        std::cout << "pass\\n";\n    } else {\n        std::cout << "retry\\n";\n    }\n    return 0;\n}'),'pass','The comparison is true for 60, so the first output runs. The retry output is skipped.','Use == to ask whether two values are equal. A single = assigns a value; it is not the equality comparison.','Which score makes this condition true?',['60','59','0'],'Try 59, 60, and 61. Predict the chosen message before running each version. Replace >= with > and explain the change at exactly 60.');
 introduce('loop-basics','Repeat instructions with a while loop',[
  'A loop repeats a group of instructions. A while loop checks its condition before every repetition, including the first. When the condition becomes false, execution continues after the loop’s closing brace.',
  'In this example count starts at 1. count <= 3 asks whether it is at most 3. The instruction count = count + 1 replaces it with the next whole number. This change eventually makes the condition false, giving the loop a way to stop. C++ also provides ++count as a shorter instruction for increasing count by one; either spelling performs this update when used as its own instruction.'
 ],program(['iostream'],'int main() {\n    int count = 1;\n    while (count <= 3) {\n        std::cout << count << "\\n";\n        count = count + 1;\n    }\n    return 0;\n}'),'1\n2\n3','Each repetition prints the current count and then increases it. After printing 3, count becomes 4, and the next condition check ends the loop.','Leaving out the increase would repeat the same value without reaching the stop condition. Use Stop if an experimental program keeps running.','Why does this loop stop?',['count becomes 4, making count <= 3 false','Printing automatically stops after three lines','The closing brace stops all repetition'],'Change the starting count to 4 and predict whether the body runs at all. Then change the upper bound to 5 and predict the entire output.');
 introduce('scope-basics','Keep local names inside their braces',[
  'A block is a group of instructions enclosed in braces. A local variable can be named only within the part of the program where it is visible. That region is its scope. A variable declared inside an inner block is not available after that block ends.',
  'The outer variable below is declared in main. The inner variable is declared between an additional pair of braces. Both can be read inside that inner block, but only outer remains available afterward. Keeping a name’s scope small makes it easier to follow where its value can change.'
 ],program(['iostream'],'int main() {\n    int outer = 10;\n    {\n        int inner = 2;\n        std::cout << outer + inner << "\\n";\n    }\n    std::cout << outer << "\\n";\n    return 0;\n}'),'12\n10','The inner block prints 10 + 2. After its closing brace, the program can still read outer, but the name inner is no longer available.','Using inner after its block ends is a source-code error, even if a previous run happened to display the expected number.','Which name is available in the final output instruction?',['outer','inner','Both names'],'Try adding std::cout << inner; after the inner block and read the compiler diagnostic. Remove that instruction, then move inner’s declaration into main and explain how its scope changes.');
 const startOrder=['first-program','numbers','text-values','decisions-basics','loop-basics','functions','collections','scope-basics'];
 const rank=new Map(chapters.map((chapter,index)=>[chapter.id,index]));
 lessons.sort((a,b)=>rank.get(a.chapter)-rank.get(b.chapter)||(a.chapter==='values'?startOrder.indexOf(a.id)-startOrder.indexOf(b.id):0));
 const introduced=new Set();
 const chapterFirst=new Set();
 for(const item of lessons){
   const foundation=foundations[item.chapter];
   if(!foundation)throw Error('Missing chapter foundation: '+item.chapter);
   item.prerequisites=foundation[0]?[foundation[0]]:[];
   if(!chapterFirst.has(item.chapter)){
     item.body.unshift(foundation[1]);chapterFirst.add(item.chapter);
   }
   item.introductions=[];
   const text=[...item.body,item.code,item.walkthrough,item.pitfall,item.question,...item.choices,item.feedback,item.experiment].join(' ');
   for(const concept of concepts){
     if(new RegExp(concept.pattern,'i').test(text)){
       if(!introduced.has(concept.id)&&item.chapter!=='values')item.introductions.push({id:concept.id,text:concept.definition});
       introduced.add(concept.id);
     }
   }
 }

}
