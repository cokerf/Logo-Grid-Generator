import {logoAppearance,setLogoAppearance,type LogoAppearance} from '../services/appearance';
import {FrameworkPanel} from './FrameworkPanel';
import React,{useId} from 'react';
import type {CustomizationOptions,DraftingOptions} from '../types';
import type {AnalysisOptions} from './AnalysisLayers';
import type {Visibility} from './ControlPanel';
import {defaultDrafting,drawingPreset,drawingPresets} from '../services/drafting';
function PresetThumb({preset}:{preset:typeof drawingPresets[number]}){
  const id='thumb-'+useId().replace(/[^\w-]/g,'');
  const measured=['measured','citron','tomato'].includes(preset.id);
  return <svg viewBox="0 0 160 78" aria-hidden="true" style={{background:preset.background}}><defs><pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-55)"><path d="M0 0H4" stroke={preset.ink} strokeWidth=".45"/></pattern></defs><g stroke={preset.accent} strokeWidth=".4" strokeDasharray={preset.id==='blueprint'?'3 2':'1 2'} opacity=".5"><path d="M25 0V78M64 0V78M105 0V78M136 0V78M0 25H160M0 55H160"/>{!measured&&<path d="M0 65L60 0M33 78L103 0M80 78L150 0"/>}</g><path d="M26 54L48 25H72L50 54ZM64 54L86 25H110L88 54ZM102 54L124 25H136L115 54Z" fill={measured?preset.ink:`url(#${id})`} stroke={preset.ink} strokeWidth=".65"/>{measured?<g stroke={preset.ink} strokeWidth=".4"><path d="M26 14H136M26 11V17M64 11V17M72 11V17M136 11V17"/><g fill={preset.ink} stroke="none" fontSize="6" textAnchor="middle"><text x="45" y="10">3.8x</text><text x="69" y="10">1x</text><text x="105" y="10">6.4x</text></g></g>:<g fill={preset.ink}>{[[26,54],[48,25],[72,25],[50,54],[86,25],[110,25],[136,25],[115,54]].map(([x,y],i)=><rect key={i} x={x-1.3} y={y-1.3} width="2.6" height="2.6"/>)}</g>}</svg>;
}
export function DrawingPanel({c,a,v,scale,setC,setA,setV,onInspect}:{c:CustomizationOptions;a:AnalysisOptions;v:Visibility;scale:number;setC:(c:CustomizationOptions)=>void;setA:(a:AnalysisOptions)=>void;setV:(v:Visibility)=>void;onInspect:()=>void}){
  const d=c.drafting||defaultDrafting;
  const update=(change:Partial<DraftingOptions>)=>setC({...c,...(change.hatch?{useOriginalColors:false}:{}),drafting:{...d,...change,presetId:undefined}});
  const check=(label:string,value:boolean,onChange:(value:boolean)=>void)=><label className="toggle-row"><span className="control-label">{label}</span><input className="toggle" type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)}/></label>;
  const field=(label:string,children:React.ReactNode)=><label className="field-row"><span className="control-label">{label}</span>{children}</label>;
  const range=(label:string,key:keyof DraftingOptions,min:number,max:number,step=1)=>field(label,<input type="range" min={min} max={max} step={step} value={Number(d[key])} onChange={e=>update({[key]:Number(e.target.value)})}/>);
  const color=(label:string,key:'hatchColor'|'guideColor'|'cornerColor')=>field(label,<input type="color" value={d[key]} onChange={e=>update({[key]:e.target.value})}/>);
  return <>
    <div className="drawing-group logo-appearance"><div className="section-title"><span>Logo appearance</span></div>
      {field('Logo appearance',<select value={logoAppearance(c)} onChange={e=>setC(setLogoAppearance(c,e.target.value as LogoAppearance))}><option value="outline">Outline</option><option value="hatch">Hatched</option><option value="solid">Solid colour</option><option value="original">Original colours</option></select>)}
      <p className="hint">Original colours keep the logo in full colour with your construction overlays.</p>
    </div>
    <details className="control-group"><summary>Drawing presets</summary><div className="control-group-body">
    <div className="drawing-presets">{drawingPresets.map(p=><button key={p.id} className={d.presetId===p.id?'active':''} aria-pressed={d.presetId===p.id} onClick={()=>{const result=drawingPreset(p.id,c,a,v,scale);setC(result.customization);setA(result.analysis);setV(result.visibility);onInspect();}}><PresetThumb preset={p}/><strong>{p.name}</strong><span>{p.description}</span></button>)}</div>
    </div></details>
    <details className="control-group"><summary>Construction frameworks</summary><div className="control-group-body"><FrameworkPanel c={c} setC={setC}/></div></details>
    <details className="control-group"><summary>Shading</summary><div className="control-group-body">
      {check('Diagonal hatch fill',d.hatch,value=>update({hatch:value}))}
      {d.hatch&&<>{range('Hatch angle','hatchAngle',-90,90,1)}{range('Hatch spacing','hatchSpacing',3,24,.5)}{range('Hatch weight','hatchWidth',.2,2,.1)}{range('Hatch opacity','hatchOpacity',.1,1,.05)}{color('Hatch colour','hatchColor')}</>}
      <p className="hint">Shade the logo while keeping its cutouts clear. Hatching works independently of Logo fill.</p>
    </div></details>
    <details className="control-group"><summary>Construction lines</summary><div className="control-group-body">
      {check('Extended construction guides',d.guides,value=>update({guides:value}))}
      {d.guides&&<>
        {field('Guide directions',<select value={d.guideAxes} onChange={e=>update({guideAxes:e.target.value as DraftingOptions['guideAxes']})}><option value="orthogonal">Horizontal & vertical</option><option value="diagonal">Diagonal</option><option value="both">All directions</option></select>)}
        {field('Guide positions',<select value={d.guideSource} onChange={e=>update({guideSource:e.target.value as DraftingOptions['guideSource']})}><option value="bounds">Path extents</option><option value="anchors">Anchor positions</option></select>)}
        {field('Guide line style',<select value={d.guideStyle} onChange={e=>update({guideStyle:e.target.value as DraftingOptions['guideStyle']})}><option value="dotted">Dotted</option><option value="dashed">Dashed</option><option value="solid">Solid</option></select>)}
        {d.guideAxes!=='orthogonal'&&<>{field('Diagonal source',<select value={d.diagonalSource} onChange={e=>update({diagonalSource:e.target.value as DraftingOptions['diagonalSource']})}><option value="edges">Logo edges, with angle fallback</option><option value="angle">Custom angle</option></select>)}{range('Diagonal angle','diagonalAngle',-85,85)}</>}
        {range('Guide count per direction','guideLimit',4,48)}{range('Guide weight','guideWidth',.2,1.5,.1)}{range('Guide opacity','guideOpacity',.1,.8,.05)}{color('Guide colour','guideColor')}
      </>}
    </div></details>
    <details className="control-group"><summary>Markers</summary><div className="control-group-body">
      {check('Anchor markers',v.anchors,value=>setV({...v,anchors:value}))}
      {field('Anchor marker shape',<select value={c.anchors.shape} onChange={e=>setC({...c,anchors:{...c.anchors,shape:e.target.value as CustomizationOptions['anchors']['shape']}})}>{['square','circle','cross','diamond'].map(shape=><option key={shape} value={shape}>{shape[0].toUpperCase()+shape.slice(1)}</option>)}</select>)}
      {field('Anchor marker size',<input type="range" min="1" max="9" step=".5" value={c.anchors.size/Math.max(scale,1)*1000} onChange={e=>setC({...c,anchors:{...c.anchors,size:Number(e.target.value)*Math.max(scale,1)/1000}})}/>)}
      {field('Anchor marker colour',<input type="color" value={c.anchors.color} onChange={e=>setC({...c,anchors:{...c.anchors,color:e.target.value}})}/>)}
      {check('Corner markers',d.cornerMarkers,value=>update({cornerMarkers:value}))}
      {d.cornerMarkers&&<>{field('Corner shape',<select value={d.cornerShape} onChange={e=>update({cornerShape:e.target.value as DraftingOptions['cornerShape']})}>{['circle','square','cross','diamond'].map(shape=><option key={shape} value={shape}>{shape[0].toUpperCase()+shape.slice(1)}</option>)}</select>)}{check('Hollow corner markers',d.cornerHollow,value=>update({cornerHollow:value}))}{range('Corner marker size','cornerSize',2,10,.5)}{color('Corner colour','cornerColor')}</>}
      {range('Clear space (logo height)','clearspace',0,.15,.01)}
    </div></details>
    <details className="control-group"><summary>Proportions</summary><div className="control-group-body">
      {check('Proportion measurements',d.proportions,value=>update({proportions:value}))}
      {d.proportions&&<>
        {field('Units across logo height',<input type="number" min=".1" max="100" step=".1" value={d.heightUnits} onChange={e=>update({heightUnits:Math.max(.1,Math.min(100,Number(e.target.value)||.1))})}/>)}
        {field('Divider positions (%)',<input className="draft-splits" type="text" placeholder="Auto from logo gaps" value={d.measureSplits} onChange={e=>update({measureSplits:e.target.value.slice(0,80)})}/>)}
        {range('Measurement label size','labelSize',8,22)}
        <p className="hint">One x is logo height ÷ {d.heightUnits}. Guides follow the actual components and gaps. Leave dividers blank for automatic measurement, or enter percentages to override.</p>
      </>}
    </div></details>
    <button className="secondary drawing-reset" onClick={()=>{setC({...c,drafting:{...defaultDrafting},framework:c.framework?{...c.framework,enabled:false}:undefined});setV({...v,anchors:false});}}>Reset drawing overlays</button>
  </>;
}
