import {diagrams} from './diagrams.js';
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const diagramFor=id=>diagrams.find(diagram=>diagram.lesson===id);
export function diagramDescription(diagram){
  const names=new Map(diagram.nodes.map(node=>[node.id,node.label]));
  return diagram.nodes.map(node=>node.label+': '+node.lines.join(' ')).join('. ')+'. '+diagram.edges.map(edge=>`${names.get(edge.source)} → ${names.get(edge.target)} (${edge.label}${edge.dashed?', dashed arrow':''})`).join('; ')+'.';
}
export function diagramSvg(diagram){
  const prefix='concept-'+diagram.lesson, nodes=new Map(diagram.nodes.map(node=>[node.id,node]));
  return `<svg xmlns="http://www.w3.org/2000/svg" class="concept-svg" viewBox="0 0 300 ${diagram.height}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc">
    <metadata>Copyright © 2026 Christopher Snow. All rights reserved. Original concept diagram for C++ Foundry.</metadata>
    <title id="${prefix}-title">${escape(diagram.title)}</title><desc id="${prefix}-desc">${escape(diagramDescription(diagram))} ${escape(diagram.caption)}</desc>
    <defs><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#56766c"/></marker></defs>
    ${diagram.edges.map(edge=>{const a=nodes.get(edge.source),b=nodes.get(edge.target);return `<path d="M ${a.x} ${a.y+50} L ${b.x} ${b.y-50}" stroke="#56766c" stroke-width="1.5" ${edge.dashed?'stroke-dasharray="5 4"':''} marker-end="url(#${prefix}-arrow)" fill="none"/>`;}).join('')}
    ${diagram.nodes.map(node=>`<g><rect x="${node.x-68}" y="${node.y-50}" width="136" height="100" rx="7" fill="#fffefa" stroke="#aebfb4"/>${node.labelLines.map((line,index)=>`<text x="${node.x}" y="${node.y-25+index*17}" text-anchor="middle" fill="#193039" font-family="system-ui,sans-serif" font-size="13" font-weight="650">${escape(line)}</text>`).join('')}${node.lines.map((line,index)=>`<text x="${node.x}" y="${node.y+13+index*17}" text-anchor="middle" fill="#4d645e" font-family="system-ui,sans-serif" font-size="12.5">${escape(line)}</text>`).join('')}</g>`).join('')}
  </svg>`;
}
export function renderDiagram(id){
  const diagram=diagramFor(id);if(!diagram)return '';
  return `<figure class="concept-diagram"><figcaption><span class="eyebrow">Concept diagram</span><strong>${escape(diagram.title)}</strong></figcaption>${diagramSvg(diagram)}<p class="diagram-caption">${escape(diagram.caption)}</p><details class="diagram-description"><summary>Text description</summary><p>${escape(diagramDescription(diagram))}</p></details></figure>`;
}
