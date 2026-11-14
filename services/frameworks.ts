import {artworkBounds,extendLine,type Bounds} from './drafting.ts';
import type {ParsedSVG} from '../types';
export type FrameworkKind='modular'|'isometric'|'radial'|'golden'|'thirds'|'baseline';
export interface FrameworkOptions {enabled:boolean;kind:FrameworkKind;extent:'canvas'|'logo';divisions:number;angle:number;rotation:number;offsetX:number;offsetY:number;opacity:number;width:number;style:'solid'|'dashed'|'dotted';color:string;circles:boolean;diagonals:boolean;}
export const defaultFramework:FrameworkOptions={enabled:false,kind:'modular',extent:'canvas',divisions:8,angle:30,rotation:0,offsetX:0,offsetY:0,opacity:.2,width:.6,style:'dotted',color:'#7561df',circles:false,diagonals:false};
export const frameworks=[{id:'modular',name:'Modular',description:'Equal units and repeated proportions.'},{id:'isometric',name:'Isometric',description:'Three axes for angled geometry.'},{id:'radial',name:'Radial',description:'Spokes and concentric divisions.'},{id:'golden',name:'Golden ratio',description:'Phi subdivisions and a golden spiral.'},{id:'thirds',name:'Rule of thirds',description:'Composition axes and intersections.'},{id:'baseline',name:'Baseline',description:'Typographic rows and vertical modules.'}] as const;
export function frameworkGeometry(data:ParsedSVG,viewport:Bounds,o:FrameworkOptions){
 const box=o.extent==='logo'?(artworkBounds(data)||viewport):viewport, n=Math.max(2,Math.min(48,Math.round(o.divisions))),scale=Math.max(data.width,data.height),cx=box.x+box.width/2+o.offsetX*scale/100,cy=box.y+box.height/2+o.offsetY*scale/100;
 const paths:string[]=[],circles:{x:number;y:number;r:number}[]=[];
 const line=(x1:number,y1:number,x2:number,y2:number)=>paths.push(`M${x1} ${y1}L${x2} ${y2}`);
 const ray=(x:number,y:number,angle:number)=>{const a=angle*Math.PI/180,l=extendLine({x,y},{x:Math.cos(a),y:Math.sin(a)},box);if(l)line(l.a.x,l.a.y,l.b.x,l.b.y);};
 const min=Math.min(box.width,box.height),step=min/n;
 if(o.kind==='modular'||o.kind==='thirds'||o.kind==='baseline'){
  const count=o.kind==='thirds'?3:n;
  for(let i=0;i<=count;i++){const y=box.y+box.height*i/count;line(box.x,y,box.x+box.width,y);}
  const cols=o.kind==='baseline'?Math.max(2,Math.round(n/2)):count;
  for(let i=0;i<=cols;i++){const x=box.x+box.width*i/cols;line(x,box.y,x,box.y+box.height);}
 }
 if(o.kind==='isometric'){
  const radius=Math.hypot(box.width,box.height),angle=Math.max(10,Math.min(80,o.angle));
  for(const a of [90,angle,-angle]){const radians=a*Math.PI/180,nx=-Math.sin(radians),ny=Math.cos(radians);for(let i=-Math.ceil(radius/step);i<=Math.ceil(radius/step);i++)ray(cx+nx*i*step,cy+ny*i*step,a);}
 }
 if(o.kind==='radial'){
  const r=Math.hypot(box.width,box.height)/2;for(let i=0;i<n;i++)ray(cx,cy,i*180/n);
  for(let i=1;i<=n;i++)circles.push({x:cx,y:cy,r:r*i/n});
 }
 if(o.kind==='golden'){
  const phi=(1+Math.sqrt(5))/2;
  for(const ratio of [0,1/(phi*phi),1/phi,1]){const x=box.x+box.width*ratio,y=box.y+box.height*ratio;line(x,box.y,x,box.y+box.height);line(box.x,y,box.x+box.width,y);}
  let d='';const turns=Math.min(5,n/2),total=240,radius=min*.48;
  for(let i=0;i<=total;i++){const theta=i/total*turns*Math.PI*2,r=radius*Math.pow(phi,(theta-turns*Math.PI*2)/(Math.PI/2));d+=`${i?'L':'M'}${cx+r*Math.cos(theta)} ${cy+r*Math.sin(theta)}`;}paths.push(d);
 }
 if(o.circles&&o.kind!=='radial')for(let i=1;i<=Math.min(n,12);i++)circles.push({x:cx,y:cy,r:min*.5*i/Math.min(n,12)});
 if(o.diagonals){line(box.x,box.y,box.x+box.width,box.y+box.height);line(box.x+box.width,box.y,box.x,box.y+box.height);}
 // Translate all rectilinear frameworks with the same origin controls used by radial systems.
 const translate=o.kind==='modular'||o.kind==='thirds'||o.kind==='baseline';
 return {paths,circles,transform:`translate(${translate?o.offsetX*scale/100:0} ${translate?o.offsetY*scale/100:0}) rotate(${o.rotation} ${cx} ${cy})`,box};
}
