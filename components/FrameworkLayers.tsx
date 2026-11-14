import React,{useMemo} from 'react';
import type {ParsedSVG} from '../types';
import type {Bounds} from '../services/drafting';
import {frameworkGeometry,type FrameworkOptions} from '../services/frameworks';
export function FrameworkLayers({data,viewport,options:o}:{data:ParsedSVG;viewport:Bounds;options:FrameworkOptions}){
 const g=useMemo(()=>o.enabled?frameworkGeometry(data,viewport,o):null,[data,viewport,o]);if(!g)return null;
 const unit=Math.max(data.width,data.height)/1000;
 return <g data-framework={o.kind} data-stage="0" fill="none" stroke={o.color} strokeWidth={o.width*unit} opacity={o.opacity} strokeDasharray={o.style==='dotted'?`${unit} ${unit*4}`:o.style==='dashed'?`${unit*6} ${unit*4}`:undefined} transform={g.transform} pointerEvents="none">{g.paths.map((d,i)=><path key={i} d={d}/>)}{g.circles.map((c,i)=><circle key={'c'+i} cx={c.x} cy={c.y} r={c.r}/>)}</g>;
}
