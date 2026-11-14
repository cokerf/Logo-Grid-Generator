import React from 'react';
import {defaultFramework,frameworks,type FrameworkOptions} from '../services/frameworks';
import type {CustomizationOptions} from '../types';
export function FrameworkPanel({c,setC}:{c:CustomizationOptions;setC:(c:CustomizationOptions)=>void}){
 const o=c.framework||{...defaultFramework,color:c.path.stroke};const update=(change:Partial<FrameworkOptions>)=>setC({...c,framework:{...o,...change}});
 const field=(label:string,content:React.ReactNode)=><label className="field-row">{label}{content}</label>;
 const range=(label:string,key:keyof FrameworkOptions,min:number,max:number,step=1)=>field(label,<input type="range" min={min} max={max} step={step} value={Number(o[key])} onChange={e=>update({[key]:Number(e.target.value)})}/>);
 const toggle=(label:string,key:'enabled'|'circles'|'diagonals')=><label className="toggle-row">{label}<input className="toggle" type="checkbox" checked={o[key]} onChange={e=>update({[key]:e.target.checked})}/></label>;
 return <div className="drawing-group framework-panel"><div className="section-title"><span>Construction frameworks</span></div><p className="hint">Add a proportional structure around your artwork, then tune it to the logo.</p>
 <div className="framework-presets">{frameworks.map((f,i)=><button key={f.id} aria-pressed={o.enabled&&o.kind===f.id} onClick={()=>update({enabled:true,kind:f.id,divisions:f.id==='radial'?12:8,circles:f.id==='radial',diagonals:false})}><svg viewBox="0 0 80 45" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth=".65" opacity=".8">{i===2?<>{[7,13,19].map(r=><circle key={r} cx="40" cy="22" r={r}/>)}{[0,30,60,90,120,150].map(a=><path key={a} d="M18 22H62" transform={`rotate(${a} 40 22)`}/>)}</>:i===1?<path d="M5 10L65 45M15 0L80 38M5 35L65 0M15 45L80 8M25 0V45M45 0V45M65 0V45"/>:i===3?<><path d="M10 4H70V41H10ZM47 4V41M10 27H70M47 18H70M56 18V27"/><path d="M47 41C10 41 10 4 47 4C70 4 70 27 56 27C47 27 47 18 56 18"/></>:<path d={i===4?'M27 2V43M53 2V43M3 15H77M3 30H77':i===5?'M5 8H75M5 16H75M5 24H75M5 32H75M5 40H75M20 0V45M60 0V45':'M10 0V45M25 0V45M40 0V45M55 0V45M70 0V45M0 8H80M0 23H80M0 38H80'}/>}</g></svg><strong>{f.name}</strong><span>{f.description}</span></button>)}</div>
 {toggle('Show framework','enabled')}{o.enabled&&<>
 {field('Framework extent',<select value={o.extent} onChange={e=>update({extent:e.target.value as FrameworkOptions['extent']})}><option value="canvas">Full canvas</option><option value="logo">Logo bounds</option></select>)}
 {range('Framework divisions','divisions',2,24)}{o.kind==='isometric'&&range('Isometric angle','angle',10,80)}{range('Framework rotation','rotation',-180,180)}{range('Horizontal offset (%)','offsetX',-50,50)}{range('Vertical offset (%)','offsetY',-50,50)}{range('Framework opacity','opacity',.02,.8,.02)}{range('Framework line weight','width',.2,2,.1)}
 {field('Framework line style',<select value={o.style} onChange={e=>update({style:e.target.value as FrameworkOptions['style']})}><option value="dotted">Dotted</option><option value="dashed">Dashed</option><option value="solid">Solid</option></select>)}
 {field('Framework colour',<input type="color" value={o.color.slice(0,7)} onChange={e=>update({color:e.target.value})}/>)}{toggle('Reference circles','circles')}{toggle('Diagonal cross','diagonals')}
 <button className="secondary" onClick={()=>update({...defaultFramework,color:c.path.stroke})}>Reset framework</button></>}
 </div>;
}
