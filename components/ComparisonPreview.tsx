import React,{useEffect,useRef} from 'react';
export function ComparisonPreview({frame,progress}:{frame:(progress:number)=>SVGSVGElement|null;progress:number}){
 const host=useRef<HTMLDivElement>(null);useEffect(()=>{const svg=frame(progress);if(!svg||!host.current)return;svg.style.width='100%';svg.style.height='100%';host.current.replaceChildren(svg);},[frame,progress]);
 return <div className="comparison-preview" ref={host} role="img" aria-label="Logo comparison preview"/>;
}
