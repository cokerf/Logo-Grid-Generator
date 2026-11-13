import paper from 'paper';
import type {ParsedSVG} from '../types.ts';
const scope=new paper.PaperScope();let ready=false;
export type MeasuredRun={start:number;end:number;kind:'shape'|'gap'};
type ComponentBox={x:number;y:number;width:number;height:number};
export function mergeMeasuredIntervals(intervals:{start:number;end:number}[],tolerance=1e-7):MeasuredRun[] {
  const sorted=intervals.filter(i=>Number.isFinite(i.start)&&Number.isFinite(i.end)&&i.end>i.start).sort((a,b)=>a.start-b.start),occupied:{start:number;end:number}[]=[];
  for(const item of sorted){const last=occupied[occupied.length-1];if(last&&item.start<=last.end+tolerance)last.end=Math.max(last.end,item.end);else occupied.push({...item});}
  return occupied.flatMap((item,i)=>[...(i?[{start:occupied[i-1].end,end:item.start,kind:'gap' as const}]:[]),{...item,kind:'shape' as const}]);
}
export const runBoundaries=(runs:MeasuredRun[])=>runs.length?[runs[0].start,...runs.map(run=>run.end)]:[];
export function measureComponentRows(boxes:ComponentBox[],tolerance:number) {
  const allBoxes=boxes;
  // An enclosing frame should not conceal the letter spacing inside it.
  const inner=boxes.filter(box=>boxes.filter(other=>other!==box&&other.x>=box.x-tolerance&&other.y>=box.y-tolerance&&other.x+other.width<=box.x+box.width+tolerance&&other.y+other.height<=box.y+box.height+tolerance&&other.width*other.height<box.width*box.height*.8).length<2);
  if(inner.length)boxes=inner;
  const rows:ComponentBox[][]=[];
  const totalHeight=Math.max(...boxes.map(b=>b.y+b.height),0)-Math.min(...boxes.map(b=>b.y),0);
  for(const box of [...boxes].sort((a,b)=>(a.y+a.height)-(b.y+b.height))){
    const row=rows.find(items=>items.some(other=>{
      const overlap=Math.min(box.y+box.height,other.y+other.height)-Math.max(box.y,other.y),minHeight=Math.min(box.height,other.height);
      return Math.abs(box.y+box.height-other.y-other.height)<Math.max(totalHeight*.025,tolerance)||minHeight>0&&overlap/minHeight>.6;
    }));
    if(row)row.push(box);else rows.push([box]);
  }
  const projected=rows.map(row=>mergeMeasuredIntervals(row.map(b=>({start:b.x,end:b.x+b.width})),tolerance));
  projected.sort((a,b)=>b.filter(r=>r.kind==='shape').length-a.filter(r=>r.kind==='shape').length||(b.at(-1)!.end-b[0].start)-(a.at(-1)!.end-a[0].start));
  return {x:projected[0]||[],y:mergeMeasuredIntervals(boxes.map(b=>({start:b.y,end:b.y+b.height})),tolerance),xGuides:[...projected.flatMap(runBoundaries),...allBoxes.flatMap(b=>[b.x,b.x+b.width])],yGuides:allBoxes.flatMap(b=>[b.y,b.y+b.height])};
}
export function measureComponents(data:ParsedSVG) {
  if(!ready){scope.setup(new scope.Size(1,1));ready=true;}scope.activate();
  const boxes:ComponentBox[]=[];
  for(const source of data.paths){const compound=new scope.CompoundPath({pathData:source.d,insert:false}),children=compound.children as paper.Path[];
    for(const child of children){
      const b=child.bounds,area=child.area;
      if(b.width===0&&b.height===0)continue;
      const ancestors=children.filter(other=>other!==child&&Math.abs(other.area)>Math.abs(area)+1e-8&&other.bounds.contains(b)&&other.contains(child.interiorPoint));
      const outside=ancestors.reduce((sum,other)=>sum+Math.sign(other.area),0);
      // Retain outer islands, including islands nested inside counters; omit actual hole contours.
      const island=Math.abs(area)<1e-8||(source.fillRule==='evenodd'?ancestors.length%2===0:outside===0&&outside+Math.sign(area)!==0);
      if(island)boxes.push({x:b.x,y:b.y,width:b.width,height:b.height});
    }compound.remove();}
  for(const text of data.texts||[])boxes.push(text.boundingBox);
  if(!boxes.length)return {x:[] as MeasuredRun[],y:[] as MeasuredRun[],xGuides:[],yGuides:[]};
  return measureComponentRows(boxes,Math.max(data.width,data.height,1)*1e-7);
}
