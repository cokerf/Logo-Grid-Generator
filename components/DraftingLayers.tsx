import {measureComponents,runBoundaries} from '../services/measurements';
import React,{useMemo} from 'react';
import type {DraftingOptions,ParsedSVG,Point} from '../types';
import {artworkBounds,draftingLines,measurementSplits,type Bounds} from '../services/drafting';
export function DraftMarker({point,size,shape,hollow,color}:{point:Point;size:number;shape:DraftingOptions['cornerShape'];hollow:boolean;color:string}) {
  const {x,y}=point,r=size/2,common={fill:hollow?'none':color,stroke:color,strokeWidth:Math.max(size*.16,.001)};
  if(shape==='circle')return <circle cx={x} cy={y} r={r} {...common}/>;
  if(shape==='cross')return <path d={`M${x-r} ${y}H${x+r}M${x} ${y-r}V${y+r}`} fill="none" stroke={color} strokeWidth={size*.18}/>;
  if(shape==='diamond')return <path d={`M${x} ${y-r}L${x+r} ${y}L${x} ${y+r}L${x-r} ${y}Z`} {...common}/>;
  return <rect x={x-r} y={y-r} width={size} height={size} {...common}/>;
}
export function HatchDefinition({id,options,scale}:{id:string;options:DraftingOptions;scale:number}) {
  const spacing=Math.max(.5,options.hatchSpacing)*scale/1000;
  return <pattern id={id} data-hatch-pattern="true" patternUnits="userSpaceOnUse" width={spacing} height={spacing} patternTransform={`rotate(${options.hatchAngle})`}>
    <path d={`M0 0H${spacing}`} stroke={options.hatchColor} strokeWidth={Math.max(.05,options.hatchWidth)*scale/1000} opacity={options.hatchOpacity}/>
  </pattern>;
}
export function DraftingLayers({data,viewport,options:o,layer}:{data:ParsedSVG;viewport:Bounds;options:DraftingOptions;layer:"guides"|"annotations"}) {
  const scale=Math.max(data.width,data.height),unit=scale/1000;
  const lines=useMemo(()=>o.guides&&layer==='guides'?draftingLines(data,viewport,o):[],[data,viewport,o,layer]);
  const measurements=useMemo(()=>o.proportions?measureComponents(data):{x:[],y:[]},[data,o.proportions]);
  const box=artworkBounds(data);if(!box)return null;
  const margin=box.height*o.clearspace,left=box.x-margin,top=box.y-margin,right=box.x+box.width+margin,bottom=box.y+box.height+margin;
  const dash=o.guideStyle==='dotted'?`${unit*.8} ${unit*3.2}`:o.guideStyle==='dashed'?`${unit*5} ${unit*4}`:undefined;
  const corners=[{x:left,y:top},{x:right,y:top},{x:left,y:bottom},{x:right,y:bottom}];
  const gap=scale*.045,fontSize=unit*o.labelSize,tick=unit*3,base=Math.max(box.height,unit)/Math.max(.1,o.heightUnits);
  const splits=o.measureSplits.trim()?measurementSplits(o.measureSplits).map(n=>box.x+box.width*n/100):runBoundaries(measurements.x);
  const ySplits=runBoundaries(measurements.y);
  const label=(value:number)=>`${Number((value/base).toPrecision(3))}x`;
  return <g pointerEvents="none" fill="none">
    {o.guides&&layer==='guides'&&<g data-stage="0" data-draft-guides="true" opacity={o.guideOpacity} stroke={o.guideColor} strokeWidth={unit*o.guideWidth} strokeDasharray={dash} strokeLinecap={o.guideStyle==='dotted'?'round':'butt'}>
      {lines.map((line,i)=><line key={i} x1={line.a.x} y1={line.a.y} x2={line.b.x} y2={line.b.y}/>)}
    </g>}
    {o.cornerMarkers&&layer==='annotations'&&<g data-stage="3" data-corner-markers="true">{corners.map((point,i)=><DraftMarker key={i} point={point} size={unit*o.cornerSize} shape={o.cornerShape} hollow={o.cornerHollow} color={o.cornerColor}/>)}</g>}
    {o.proportions&&layer==='annotations'&&<g data-stage="3" data-proportion-labels="true" stroke={o.guideColor} strokeWidth={unit*.5}>
      <path d={`M${splits[0]??box.x} ${box.y-gap}H${splits.at(-1)??box.x+box.width}M${box.x-gap} ${box.y}V${box.y+box.height}`}/>
      {splits.map((x,i)=><path key={i} d={`M${x} ${box.y-gap-tick}V${box.y-gap+tick}M${x} ${box.y-gap+tick*2}V${box.y-unit*5}`} strokeOpacity=".55"/>)}
      {ySplits.map((y,i)=><path key={i} d={`M${box.x-gap-tick} ${y}H${box.x-gap+tick}M${box.x-gap+tick*2} ${y}H${box.x-unit*5}`} strokeOpacity=".55"/>)}
      <g fill={o.guideColor} stroke="none" fontFamily="Archivo,Arial,sans-serif" fontSize={fontSize} textAnchor="middle">
        {splits.slice(1).map((x,i)=><text key={i} data-measure-start={splits[i]} data-measure-end={x} data-measure-kind={o.measureSplits.trim()?"custom":measurements.x[i]?.kind} fontSize={Math.min(fontSize,Math.max(unit*4,(x-splits[i])*.35))} x={(x+splits[i])/2} y={box.y-gap-fontSize*.75}>{label(x-splits[i])}</text>)}
        {ySplits.slice(1).map((y,i)=><text key={"y"+i} data-measure-axis="y" data-measure-kind={measurements.y[i]?.kind} x={box.x-gap-fontSize*.8} y={(y+ySplits[i])/2+fontSize*.35} fontSize={Math.min(fontSize,Math.max(unit*4,(y-ySplits[i])*.5))} textAnchor="end">{label(y-ySplits[i])}</text>)}
        {o.clearspace>0&&corners.map((p,i)=><text key={i} x={p.x+(i%2?-unit*16:unit*16)} y={p.y+(i>1?-unit*10:unit*16)} fontSize={fontSize*.65}>x</text>)}
      </g>
    </g>}
  </g>;
}
