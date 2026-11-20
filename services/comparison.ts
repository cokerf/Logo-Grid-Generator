import {makeExportSVG,applyConstruction,type ExportSettings} from './exporter.ts';
export type ComparisonLayout='side-by-side'|'wipe'|'overlay';
export interface ComparisonOptions{layout:ComparisonLayout;labels:boolean;beforeLabel:string;afterLabel:string;construction:boolean;}
export const defaultComparison:ComparisonOptions={layout:'side-by-side',labels:true,beforeLabel:'Before',afterLabel:'After',construction:false};
export function comparisonLayout(width:number,height:number,layout:ComparisonLayout,progress:number){
 const t=Math.max(0,Math.min(1,progress));
 return {panelWidth:layout==='side-by-side'?Math.ceil(width/2):width,panelHeight:height,divider:width*(1-t),beforeOpacity:layout==='overlay'?1-t:1,afterOpacity:layout==='overlay'?t:1};
}
let serial=0;
const ns='http://www.w3.org/2000/svg';
export function createComparisonSVG(before:SVGSVGElement,after:SVGSVGElement|null,settings:ExportSettings,o:ComparisonOptions,progress:number,background:string,ink:string){
 const {width,height}=settings,l=comparisonLayout(width,height,o.layout,progress),prefix=`comparison-${++serial}-`,root=document.createElementNS(ns,'svg');
 root.setAttribute('xmlns',ns);root.setAttribute('viewBox',`0 0 ${width} ${height}`);root.setAttribute('width',String(width));root.setAttribute('height',String(height));root.setAttribute('data-comparison',o.layout);
 const rect=document.createElementNS(ns,'rect');rect.setAttribute('width','100%');rect.setAttribute('height','100%');rect.setAttribute('fill',settings.transparent?'none':background);root.append(rect);
 const first=makeExportSVG(before,{...settings,width:l.panelWidth,height,transparent:true},background),second=after?makeExportSVG(after,{...settings,width:o.layout==='side-by-side'?Math.floor(width/2):width,height,transparent:true},background):null;
 if(o.construction){applyConstruction(first,Math.min(1,progress*2),settings.ending,settings.motion);if(second)applyConstruction(second,Math.max(0,progress*2-1),settings.ending,settings.motion);}
 first.setAttribute('opacity',String(l.beforeOpacity));root.append(first);
 if(second){second.setAttribute('opacity',String(l.afterOpacity));
  if(o.layout==='side-by-side')second.setAttribute('x',String(l.panelWidth));
  if(o.layout==='wipe'){
   const defs=document.createElementNS(ns,'defs'),clip=document.createElementNS(ns,'clipPath'),r=document.createElementNS(ns,'rect');clip.id=prefix+'clip';r.setAttribute('x',String(l.divider));r.setAttribute('width',String(width-l.divider));r.setAttribute('height',String(height));clip.append(r);const firstClip=document.createElementNS(ns,'clipPath'),firstRect=document.createElementNS(ns,'rect');firstClip.id=prefix+'before';firstRect.setAttribute('width',String(l.divider));firstRect.setAttribute('height',String(height));firstClip.append(firstRect);defs.append(clip,firstClip);root.append(defs);first.setAttribute('clip-path',`url(#${firstClip.id})`);second.setAttribute('clip-path',`url(#${clip.id})`);
  }root.append(second);
 }
 if(o.layout!=='overlay'){
  const line=document.createElementNS(ns,'line'),x=o.layout==='side-by-side'?l.panelWidth:l.divider;line.setAttribute('x1',String(x));line.setAttribute('x2',String(x));line.setAttribute('y2',String(height));line.setAttribute('stroke',ink);line.setAttribute('stroke-opacity','.3');line.setAttribute('stroke-width',String(Math.max(width,height)/1500));root.append(line);
 }
 if(!after){const text=document.createElementNS(ns,'text');text.setAttribute('x',String(width*.75));text.setAttribute('y',String(height*.5));text.setAttribute('text-anchor','middle');text.setAttribute('fill',ink);text.setAttribute('font-family','Archivo,Arial,sans-serif');text.setAttribute('font-size',String(width*.014));text.textContent='Add the second logo';root.append(text);}
 if(o.labels){[o.beforeLabel,o.afterLabel].forEach((label,index)=>{const text=document.createElementNS(ns,'text');text.setAttribute('x',String(o.layout==='side-by-side'?width*(index?.75:.25):index?width-24:24));text.setAttribute('y','32');text.setAttribute('text-anchor',o.layout==='side-by-side'?'middle':index?'end':'start');text.setAttribute('font-family','Archivo,Arial,sans-serif');text.setAttribute('font-size',String(Math.max(12,width*.012)));text.setAttribute('fill',ink);text.textContent=label;root.append(text);});}
 return root;
}
