import paper from 'paper';
import {parseSVG,parsePathD} from './svgParser.ts';
import type {ParsedSVG} from '../types';
const ns='http://www.w3.org/2000/svg';
const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
export function needsRenderedImport(source:string,outlineText=false){
  const effects=/<(?:[\w-]+:)?(?:use|symbol|clipPath|mask|image|filter|linearGradient|radialGradient|pattern|marker|switch|foreignObject)\b/i.test(source);
  const styles=Array.from(source.matchAll(/\b(?:clip-path|mask|filter|stroke)\s*[:=]\s*["']?([^;"'\s>]+)/gi)).some(m=>!['none','transparent','0'].includes(m[1].toLowerCase()));
  return effects||styles||/<svg[\s\S]*<svg\b/i.test(source)||(outlineText&&/<text[\s>]/i.test(source));
}
/** Trace the visible silhouette, after the browser resolves masks, instances and type. */
export function traceAlpha(pixels:Uint8ClampedArray,width:number,height:number){
  const mask=new Uint8Array(width*height);
  const corners=[0,(width-1)*4,(height-1)*width*4,(height*width-1)*4];
  const backdrop=corners.every(i=>pixels[i+3]>250&&Math.abs(pixels[i]-pixels[0])+Math.abs(pixels[i+1]-pixels[1])+Math.abs(pixels[i+2]-pixels[2])<12);
  let count=0;
  for(let i=0;i<mask.length;i++){const p=i*4;mask[i]=pixels[p+3]>32&&(!backdrop||Math.abs(pixels[p]-pixels[0])+Math.abs(pixels[p+1]-pixels[1])+Math.abs(pixels[p+2]-pixels[2])>24)?1:0;count+=mask[i];}
  if(!count)for(let i=0;i<mask.length;i++)mask[i]=pixels[i*4+3]>32?1:0;
  const edges=new Map<number,number[]>(),stride=width+1;
  const add=(a:number,b:number)=>{const list=edges.get(a);if(list)list.push(b);else edges.set(a,[b]);};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){if(!mask[y*width+x])continue;const p=y*stride+x;
    if(!y||!mask[(y-1)*width+x])add(p,p+1);
    if(x===width-1||!mask[y*width+x+1])add(p+1,p+stride+1);
    if(y===height-1||!mask[(y+1)*width+x])add(p+stride+1,p+stride);
    if(!x||!mask[y*width+x-1])add(p+stride,p);
  }
  const contours:number[][]=[];
  while(edges.size){const start=edges.keys().next().value!,points:number[]=[];let key=start,guard=0;
    do{points.push(key%stride,Math.floor(key/stride));const list=edges.get(key);if(!list?.length)break;const next=list.pop()!;if(!list.length)edges.delete(key);key=next;if(++guard>width*height*4)break;}while(key!==start);
    if(points.length>=8)contours.push(points);
  }
  return contours;
}
function sanitize(svg:Element,fontCSS:string,fontFamily?:string){
  const copy=svg.cloneNode(true) as SVGSVGElement;
  const safeURLs=(value:string)=>value.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi,(_,quote,url)=>/^(#|data:)/i.test(url.trim())?`url(${quote}${url}${quote})`:'none');
  copy.querySelectorAll('script,foreignObject,iframe,object,embed,audio,video,animate,animateTransform,animateMotion,set').forEach(n=>n.remove());
  for(const el of [copy,...Array.from(copy.querySelectorAll('*'))]){
    for(const attr of Array.from(el.attributes)){
      if(/^on/i.test(attr.name)||/javascript\s*:/i.test(attr.value))el.removeAttribute(attr.name);
      else if(/url\(/i.test(attr.value))el.setAttribute(attr.name,safeURLs(attr.value));
      if((attr.localName==='href'||attr.name==='src')&&!attr.value.startsWith('#')&&!/^data:image\/(png|jpeg|webp|gif|svg\+xml)[;,]/i.test(attr.value))el.removeAttribute(attr.name);
    }
    const style=el.getAttribute('style');if(style)el.setAttribute('style',safeURLs(style.replace(/@import[^;]+;?/gi,'')));
  }
  for(const style of Array.from(copy.querySelectorAll('style')))style.textContent=safeURLs((style.textContent||'').replace(/@import[^;]+;?/gi,''));
  if(fontCSS){const style=document.createElementNS(ns,'style');style.textContent=fontCSS;copy.prepend(style);}
  if(fontFamily)copy.querySelectorAll('text,tspan,textPath').forEach(t=>t.setAttribute('font-family',fontFamily));
  copy.setAttribute('xmlns',ns);return copy;
}
export async function importSVG(source:string,fontFamily?:string,fontCSS='',outlineText=false):Promise<ParsedSVG>{
  if(source.length>15_000_000)throw new Error('Please use an SVG smaller than 15 MB.');
  const doc=new DOMParser().parseFromString(source,'image/svg+xml'),original=doc.querySelector('svg');
  if(!original||doc.querySelector('parsererror'))throw new Error('This file is not valid SVG.');
  if(!needsRenderedImport(source,outlineText))try{return parseSVG(source,fontFamily);}catch{/* Render valid SVGs that the editable path importer cannot normalize. */}
  await document.fonts.ready;
  for(const node of Array.from(original.querySelectorAll('image'))){
    const href=node.getAttribute('href')||node.getAttributeNS('http://www.w3.org/1999/xlink','href');
    if(!href||href.startsWith('#')||href.startsWith('data:'))continue;
    try{const response=await fetch(href,{credentials:'omit',signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error();const blob=await response.blob();const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);});node.removeAttributeNS('http://www.w3.org/1999/xlink','href');node.setAttribute('href',data);}catch{throw new Error('A linked image could not be loaded. Include that image in the SVG file and try again.');}
  }
  const svg=sanitize(original,fontCSS,fontFamily);
  let box=(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);
  if(box.length!==4||!box.every(Number.isFinite)||box[2]<=0||box[3]<=0){const length=(name:string)=>parseFloat(svg.getAttribute(name)||'');box=[0,0,length('width')||1000,length('height')||1000];svg.setAttribute('viewBox',box.join(' '));}
  const [, ,w,h]=box,scale=Math.min(2048/w,2048/h),width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));
  svg.setAttribute('width',String(width));svg.setAttribute('height',String(height));
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
  const image=new Image();
  try{await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('The SVG could not be rendered. Include any linked images in the SVG file.'));image.src=url;});
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,0,0,width,height);
    const contours=traceAlpha(ctx.getImageData(0,0,width,height).data,width,height);
    if(!contours.length)throw new Error('The SVG has no visible artwork. Check hidden layers and linked assets.');
    scope.activate();let d='';
    for(const points of contours){const path=new scope.Path({insert:false,closed:true});for(let i=0;i<points.length;i+=2)path.add(new scope.Point(points[i],points[i+1]));if(Math.abs(path.area)<1){path.remove();continue;}path.simplify(.55);d+=path.pathData;path.remove();}
    const parsed=parseSVG(`<svg xmlns="${ns}" viewBox="0 0 ${width} ${height}"><path fill-rule="evenodd" d="${d}"/></svg>`);
    return {...parsed,rawSVG:source,renderedArtwork:canvas.toDataURL('image/png'),renderedArtworkBounds:{x:0,y:0,width,height}};
  }finally{URL.revokeObjectURL(url);}
}
