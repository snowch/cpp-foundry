import {learningModels} from './learning-models.js';
import {learningFigure} from './learning-model.js';
import {diagrams} from './diagrams.js';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const diagramFor=id=>diagrams.find(diagram=>diagram.lesson===id);
export function diagramDescription(diagram){
  const names=new Map(diagram.nodes.map(node=>[node.id,node.label]));
  return diagram.nodes.map(node=>node.label+': '+node.lines.join(' ')).join('. ')+'. '+diagram.edges.map(edge=>`${names.get(edge.source)} → ${names.get(edge.target)} (${edge.label}${edge.dashed?', dashed arrow':''})`).join('; ')+'.';
}
export function diagramSvg(diagram){
  const prefix='concept-'+diagram.lesson, nodes=new Map(diagram.nodes.map(node=>[node.id,{...node,x:node.x*4/3}]));
  return `<svg xmlns="http://www.w3.org/2000/svg" class="concept-svg" width="400" height="${diagram.height}" viewBox="0 0 400 ${diagram.height}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc">
    <metadata>Copyright © 2026 Christopher Snow. All rights reserved. Original concept diagram for C++ Foundry.</metadata>
    <title id="${prefix}-title">${escape(diagram.title)}</title><desc id="${prefix}-desc">${escape(diagramDescription(diagram))} ${escape(diagram.caption)}</desc>
    <defs><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7866d9"/></marker></defs>
    ${diagram.edges.map(edge=>{const a=nodes.get(edge.source),b=nodes.get(edge.target),x=a.x===b.x?a.x+14:b.x<a.x?20:380,anchor=b.x>a.x?'end':'start';return `<path d="M ${a.x} ${a.y+50} L ${b.x} ${b.y-50}" stroke="#7866d9" stroke-width="1.5" ${edge.dashed?'stroke-dasharray="5 4"':''} marker-end="url(#${prefix}-arrow)" fill="none"/><text x="${x}" y="${(a.y+b.y)/2+4}" text-anchor="${anchor}" fill="#44445b" font-family="system-ui,sans-serif" font-size="16">${escape(edge.label)}</text>`;}).join('')}
    ${Array.from(nodes.values()).map(node=>`<g><rect x="${node.x-80}" y="${node.y-50}" width="160" height="100" rx="7" fill="#ffffff" stroke="#d7d6eb"/>${node.labelLines.map((line,index)=>`<text x="${node.x}" y="${node.y-25+index*17}" text-anchor="middle" fill="#24243d" font-family="system-ui,sans-serif" font-size="17" font-weight="650">${escape(line)}</text>`).join('')}${node.lines.map((line,index)=>`<text x="${node.x}" y="${node.y+13+index*17}" text-anchor="middle" fill="#60647a" font-family="system-ui,sans-serif" font-size="16">${escape(line)}</text>`).join('')}</g>`).join('')}
  </svg>`;
}
export function renderDiagram(id){
  if(learningModels[id])return learningFigure(learningModels[id],id);
  const diagram=diagramFor(id);if(!diagram)return '';
  return `<figure class="concept-diagram"><figcaption><strong>${escape(diagram.title)}</strong></figcaption>${diagramSvg(diagram)}<p class="diagram-caption">${escape(diagram.caption)}</p><details class="diagram-description"><summary>Read the diagram in words</summary><p>${escape(diagramDescription(diagram))}</p></details></figure>`;
}
