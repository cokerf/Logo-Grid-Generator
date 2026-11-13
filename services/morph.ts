import paper from 'paper';
import svgpath from 'svgpath';
import {parsePathD} from './svgParser.ts';
import type {ParsedSVG,Point} from '../types';
const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
type Contour={points:Point[];vectors:Point[];closed:boolean;center:Point;area:number};
export type MorphOptions={easing:'smooth'|'linear'|'cinematic';direction:'forward'|'reverse'|'roundtrip';hold:number};
export const defaultMorph:MorphOptions={easing:'cinematic',direction:'forward',hold:.12};
export function morphProgress(t:number,options:MorphOptions){
  t=Math.max(0,Math.min(1,t));
  if(options.direction==='roundtrip')t=t<=.5?t*2:2-t*2;
  t=Math.max(0,Math.min(1,(t-options.hold)/(1-2*options.hold)));
  if(options.easing==='smooth')t=t*t*(3-2*t);
  if(options.easing==='cinematic')t=t*t*t*(t*(6*t-15)+10);
  return options.direction==='reverse'?1-t:t;
}
function contours(data:ParsedSVG):Contour[]{
  scope.activate();const [x,y,w,h]=data.viewBox.split(/[ ,]+/).map(Number),scale=1000/Math.max(w,h);
  const out:Contour[]=[];
  for(const path of data.paths){const item=new scope.CompoundPath({pathData:path.d,insert:false});
    for(const child of item.children as paper.Path[]){if(child.length<1e-8)continue;
      const points=Array.from({length:128},(_,i)=>{const p=child.getPointAt(child.length*i/(child.closed?128:127))||child.firstSegment.point;return {x:(p.x-x-w/2)*scale+500,y:(p.y-y-h/2)*scale+500};});
      const center={x:points.reduce((s,p)=>s+p.x,0)/128,y:points.reduce((s,p)=>s+p.y,0)/128};
      const vectors=points.map((_,i)=>{const t=child.getTangentAt(child.length*i/(child.closed?128:127));const length=child.length/(child.closed?128:127)/3*scale;return {x:(t?.x||0)*length,y:(t?.y||0)*length};});
      out.push({points,vectors,center,closed:child.closed,area:Math.abs(child.area)*scale*scale});
    }item.remove();
  }return out.sort((a,b)=>b.area-a.area);
}
function align(a:Contour,b:Contour):Contour{
  if(!a.closed||!b.closed){const cost=(reverse:boolean)=>a.points.reduce((s,p,i)=>s+(p.x-b.points[reverse?127-i:i].x)**2+(p.y-b.points[reverse?127-i:i].y)**2,0);return cost(true)<cost(false)?{...b,points:[...b.points].reverse(),vectors:[...b.vectors].reverse().map(p=>({x:-p.x,y:-p.y}))}:b;}
  let best=Infinity,points=b.points,vectors=b.vectors;
  for(const reverse of [false,true]){const candidates=reverse?[...b.points].reverse():b.points;for(let shift=0;shift<128;shift++){let cost=0;for(let i=0;i<128;i+=4){const p=a.points[i],q=candidates[(i+shift)%128];cost+=(p.x-q.x)**2+(p.y-q.y)**2;}if(cost<best){best=cost;points=candidates.map((_,i)=>candidates[(i+shift)%128]);const vs=reverse?[...b.vectors].reverse().map(p=>({x:-p.x,y:-p.y})):b.vectors;vectors=vs.map((_,i)=>vs[(i+shift)%128]);}}}
  return {...b,points,vectors};
}
function collapsed(c:Contour):Contour{return {...c,points:c.points.map(()=>({...c.center})),vectors:c.points.map(()=>({x:0,y:0}))};}
function normalized(data:ParsedSVG,prefix:string):ParsedSVG{
  const [x,y,w,h]=data.viewBox.split(/[ ,]+/).map(Number),scale=1000/Math.max(w,h),tx=500-(x+w/2)*scale,ty=500-(y+h/2)*scale;
  const paths=data.paths.map(p=>{const d=svgpath(p.d).matrix([scale,0,0,scale,tx,ty]).toString();const b=p.boundingBox;return {...p,d,...parsePathD(d),boundingBox:b?{x:b.x*scale+tx,y:b.y*scale+ty,width:b.width*scale,height:b.height*scale} as SVGRect:null};});
  const ids=new Map<string,string>();
  const markup=(data.definitions||'')+(data.texts||[]).map(t=>t.markup).join('');
  for(const match of markup.matchAll(/\bid=["']([^"']+)["']/g))ids.set(match[1],prefix+match[1]);
  const rewrite=(value:string)=>value.replace(/\bid=(["'])([^"']+)\1/g,(all,q,id)=>`id=${q}${ids.get(id)||id}${q}`).replace(/(href=["'])#([^"']+)(["'])/g,(all,a,id,b)=>`${a}#${ids.get(id)||id}${b}`).replace(/url\(\s*(['"]?)#([^\s)'";]+)\1\s*\)/g,(all,q,id)=>`url(#${ids.get(id)||id})`);
  const texts=(data.texts||[]).map(t=>({markup:`<g transform="matrix(${scale} 0 0 ${scale} ${tx} ${ty})">${rewrite(t.markup)}</g>`,boundingBox:{x:t.boundingBox.x*scale+tx,y:t.boundingBox.y*scale+ty,width:t.boundingBox.width*scale,height:t.boundingBox.height*scale} as SVGRect}));
  const b=data.renderedArtworkBounds;
  return {...data,renderedArtworkBounds:b?{x:b.x*scale+tx,y:b.y*scale+ty,width:b.width*scale,height:b.height*scale}:undefined,viewBox:'0 0 1000 1000',width:1000,height:1000,paths,texts,definitions:rewrite(data.definitions||'')};
}
export function prepareMorph(from:ParsedSVG,to:ParsedSVG){
  const start=normalized(from,'morph-from-'),end=normalized(to,'morph-to-');
  const a=contours(from),remaining=contours(to),pairs:{a:Contour;b:Contour}[]=[];
  for(const contour of a){let index=-1,best=Infinity;remaining.forEach((c,i)=>{if(c.closed!==contour.closed)return;const cost=(c.center.x-contour.center.x)**2+(c.center.y-contour.center.y)**2+Math.abs(Math.sqrt(c.area)-Math.sqrt(contour.area))*200;if(cost<best){index=i;best=cost;}});const target=index<0?collapsed(contour):remaining.splice(index,1)[0];pairs.push({a:contour,b:align(contour,target)});}
  for(const target of remaining)pairs.push({a:collapsed(target),b:target});
  if(!pairs.length&&!start.texts?.length&&!end.texts?.length)throw new Error('Choose two SVG logos to create a morph.');
  return (progress:number):ParsedSVG=>{
    const t=Math.max(0,Math.min(1,progress));
    if(t===0)return start;if(t===1)return end;
    // Interpolate sampled positions and tangent controls so construction curves remain continuous.
    const paths=pairs.map(({a,b})=>{const pts=a.points.map((p,i)=>({x:p.x+(b.points[i].x-p.x)*t,y:p.y+(b.points[i].y-p.y)*t}));const vectors=a.vectors.map((p,i)=>({x:p.x+(b.vectors[i].x-p.x)*t,y:p.y+(b.vectors[i].y-p.y)*t}));let d=`M${pts[0].x} ${pts[0].y}`;for(let i=0;i<(a.closed?128:127);i++){const j=(i+1)%128,p=pts[i],q=pts[j],v=vectors[i],w=vectors[j];d+=`C${p.x+v.x} ${p.y+v.y} ${q.x-w.x} ${q.y-w.y} ${q.x} ${q.y}`;}if(a.closed)d+='Z';const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);return {d,...parsePathD(d),fillRule:'evenodd' as const,boundingBox:{x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)} as SVGRect};});
    // One compound preserves counters when filled or hatched.
    const boxes=paths.map(p=>p.boundingBox),minX=Math.min(...boxes.map(b=>b.x)),minY=Math.min(...boxes.map(b=>b.y)),maxX=Math.max(...boxes.map(b=>b.x+b.width)),maxY=Math.max(...boxes.map(b=>b.y+b.height));
    const texts=[...(start.texts||[]).map(text=>({...text,markup:`<g opacity="${1-t}">${text.markup}</g>`})),...(end.texts||[]).map(text=>({...text,markup:`<g opacity="${t}">${text.markup}</g>`}))];
    const d=paths.map(p=>p.d).join(''),parsed=parsePathD(d);parsed.points=parsed.points.filter((_,i)=>i%8===0);parsed.handles=parsed.handles.filter((_,i)=>i%16===0);return {rawSVG:'',viewBox:'0 0 1000 1000',width:1000,height:1000,texts,definitions:(start.definitions||'')+(end.definitions||''),paths:d?[{d,...parsed,fillRule:'evenodd',boundingBox:{x:minX,y:minY,width:maxX-minX,height:maxY-minY} as SVGRect}]:[]};
  };
}
