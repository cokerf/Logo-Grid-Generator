import type {DraftingOptions,ParsedSVG,Point,CustomizationOptions} from '../types.ts';
import type {AnalysisOptions} from '../components/AnalysisLayers.tsx';
import type {Visibility} from '../components/ControlPanel.tsx';
export const defaultDrafting:DraftingOptions={hatch:false,hatchAngle:-55,hatchSpacing:7,hatchWidth:.55,hatchOpacity:.7,hatchColor:'#e2defa',guides:false,guideAxes:'both',guideSource:'bounds',guideStyle:'dotted',guideColor:'#e2defa',guideWidth:.5,guideOpacity:.28,guideLimit:24,diagonalSource:'edges',diagonalAngle:-55,cornerMarkers:false,cornerShape:'circle',cornerSize:4,cornerColor:'#e2defa',cornerHollow:true,clearspace:0,proportions:false,heightUnits:4.2,measureSplits:'',labelSize:13};
export type Bounds={x:number;y:number;width:number;height:number};
export type DraftLine={a:Point;b:Point};
export function artworkBounds(data:ParsedSVG):Bounds|null {
  const boxes=[...data.paths.map(p=>p.boundingBox),...(data.texts||[]).map(t=>t.boundingBox)].filter((b):b is SVGRect=>!!b&&[b.x,b.y,b.width,b.height].every(Number.isFinite));
  if(!boxes.length)return null;
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
  return {x,y,width:Math.max(...boxes.map(b=>b.x+b.width))-x,height:Math.max(...boxes.map(b=>b.y+b.height))-y};
}
export function extendLine(p:Point,d:Point,box:Bounds):DraftLine|null {
  if(![p.x,p.y,d.x,d.y].every(Number.isFinite)||Math.hypot(d.x,d.y)<1e-10)return null;
  const hits:Point[]=[];
  const add=(x:number,y:number)=>{if(x>=box.x-1e-6&&x<=box.x+box.width+1e-6&&y>=box.y-1e-6&&y<=box.y+box.height+1e-6&&!hits.some(a=>Math.hypot(a.x-x,a.y-y)<1e-6))hits.push({x,y});};
  if(Math.abs(d.x)>1e-10)for(const x of [box.x,box.x+box.width])add(x,p.y+(x-p.x)*d.y/d.x);
  if(Math.abs(d.y)>1e-10)for(const y of [box.y,box.y+box.height])add(p.x+(y-p.y)*d.x/d.y,y);
  return hits.length>=2?{a:hits[0],b:hits[1]}:null;
}
export function sparsePositions(values:number[],spacing:number,limit:number) {
  const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b), unique:number[]=[];
  for(const value of sorted)if(!unique.length||value-unique[unique.length-1]>spacing)unique.push(value);
  if(unique.length<=limit)return unique;
  return Array.from({length:limit},(_,i)=>unique[Math.round(i*(unique.length-1)/(limit-1))]);
}
export function measurementSplits(input:string) {
  const numbers=input.split(/[,;\s]+/).filter(Boolean).map(Number).filter(n=>Number.isFinite(n)&&n>0&&n<100);
  return [0,...Array.from(new Set(numbers)).sort((a,b)=>a-b).slice(0,7),100];
}
export function draftingLines(data:ParsedSVG,viewport:Bounds,o:DraftingOptions):DraftLine[] {
  const bounds=artworkBounds(data);if(!bounds)return [];
  const scale=Math.max(data.width,data.height),limit=Math.max(4,Math.min(64,Math.round(o.guideLimit))),result:DraftLine[]=[];
  if(o.guideAxes!=='diagonal'){
    const points=o.guideSource==='anchors'?data.paths.flatMap(p=>p.points):data.paths.flatMap(p=>p.boundingBox?[{x:p.boundingBox.x,y:p.boundingBox.y},{x:p.boundingBox.x+p.boundingBox.width,y:p.boundingBox.y+p.boundingBox.height}]:[]);
    points.push({x:bounds.x,y:bounds.y},{x:bounds.x+bounds.width,y:bounds.y+bounds.height});
    const margin=bounds.height*o.clearspace;
    const xs=[...points.map(p=>p.x),bounds.x-margin,bounds.x+bounds.width+margin,...(o.proportions?measurementSplits(o.measureSplits).map(n=>bounds.x+bounds.width*n/100):[])],ys=[...points.map(p=>p.y),bounds.y-margin,bounds.y+bounds.height+margin];
    for(const x of sparsePositions(xs,scale*.006,limit))result.push({a:{x,y:viewport.y},b:{x,y:viewport.y+viewport.height}});
    for(const y of sparsePositions(ys,scale*.006,limit))result.push({a:{x:viewport.x,y},b:{x:viewport.x+viewport.width,y}});
  }
  if(o.guideAxes!=='orthogonal'){
    const candidates:{p:Point;d:Point}[]=[];
    if(o.diagonalSource==='edges')for(const path of data.paths){
      let previous:Point|null=null,start:Point|null=null;
      for(const segment of path.segments){
        const end=segment.command==='Z'?start:segment.values.length>=2?{x:segment.values[segment.values.length-2],y:segment.values[segment.values.length-1]}:null;
        if(end&&previous&&(segment.command==='L'||segment.command==='Z')){
          const d={x:end.x-previous.x,y:end.y-previous.y};
          if(Math.hypot(d.x,d.y)>scale*.015&&Math.abs(d.x)>scale*.005&&Math.abs(d.y)>scale*.005)candidates.push({p:previous,d});
        }
        if(segment.command==='M')start=end;
        previous=end;
      }
    }
    if(o.diagonalSource==='angle'||!candidates.length){
      const radians=o.diagonalAngle*Math.PI/180,d={x:Math.cos(radians),y:Math.sin(radians)};
      const anchors=data.paths.flatMap(p=>p.points),count=Math.min(limit,12,anchors.length);
      for(let i=0;i<count;i++)candidates.push({p:anchors[Math.round(i*(anchors.length-1)/Math.max(count-1,1))],d});
    }
    const seen:{angle:number;offset:number}[]=[];
    for(const {p,d} of candidates){
      const length=Math.hypot(d.x,d.y),sign=d.x<0?-1:1,nx=-d.y/length*sign,ny=d.x/length*sign,angle=Math.atan2(ny,nx),offset=nx*p.x+ny*p.y;
      if(seen.some(s=>Math.abs(s.angle-angle)<.025&&Math.abs(s.offset-offset)<scale*.006))continue;
      const line=extendLine(p,d,viewport);if(line){result.push(line);seen.push({angle,offset});}
      if(seen.length>=limit)break;
    }
  }
  return result;
}
export const drawingPresets=[
  {id:'plum',name:'Plum hatch',description:'Diagonal shading, dotted extensions and square nodes.',background:'#2b203a',ink:'#f4eef9',accent:'#f4eef9'},
  {id:'measured',name:'Measured mono',description:'Proportion labels, fine guides and hollow circles.',background:'#050505',ink:'#ffffff',accent:'#b9bcc4'},
  {id:'paper',name:'Drafting paper',description:'Warm paper, graphite hatching and cross markers.',background:'#f4f1e8',ink:'#343a35',accent:'#637e5b'},
  {id:'blueprint',name:'Precision blue',description:'A blue field, dashed guides and diamond nodes.',background:'#102c49',ink:'#d2eeff',accent:'#80c8f3'},
] as const;
export function drawingPreset(id:string,c:CustomizationOptions,a:AnalysisOptions,v:Visibility,scale:number) {
  const preset=drawingPresets.find(p=>p.id===id)||drawingPresets[0],unit=Math.max(scale,1)/1000,measured=preset.id==='measured';
  const drafting:DraftingOptions={...defaultDrafting,presetId:preset.id,hatch:!measured,hatchColor:preset.ink,hatchSpacing:measured?7:preset.id==='paper'?6:7,guides:true,guideAxes:measured?'orthogonal':'both',guideColor:preset.accent,guideStyle:preset.id==='blueprint'?'dashed':'dotted',guideLimit:18,cornerMarkers:measured||preset.id==='paper',cornerShape:preset.id==='paper'?'cross':'circle',cornerColor:preset.accent,proportions:measured,measureSplits:measured?'24,30':'',guideOpacity:measured?.3:.24};
  return {customization:{...c,drafting,canvasBackground:preset.background,useOriginalColors:false,showFill:measured,fillColor:preset.ink,path:{stroke:preset.ink,strokeWidth:measured?.45*unit:.85*unit},anchors:{...c.anchors,color:preset.ink,size:4*unit,shape:preset.id==='blueprint'?'diamond' as const:preset.id==='paper'?'cross' as const:'square' as const},handles:{color:preset.accent,width:.6*unit},rulers:{background:preset.background,text:preset.ink+'99'}},analysis:{...a,curves:false,dimensions:false,spines:false,circles:false,color:preset.accent},visibility:{...v,grid:false,anchors:!measured,handles:false,outlines:false,alignment:false,elementGuides:false}};
}
