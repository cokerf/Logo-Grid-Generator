import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
export type QuickAction={label:string;run:()=>void;disabled?:boolean;checked?:boolean;breakBefore?:boolean};
export function QuickMenu({point,actions,onClose}:{point:{x:number;y:number};actions:QuickAction[];onClose:()=>void}){
  const ref=useRef<HTMLDivElement>(null),[position,setPosition]=useState(point);
  useLayoutEffect(()=>{const box=ref.current?.getBoundingClientRect();if(box)setPosition({x:Math.max(8,Math.min(point.x,window.innerWidth-box.width-8)),y:Math.max(8,Math.min(point.y,window.innerHeight-box.height-8))});},[point]);
  useEffect(()=>{const old=document.activeElement as HTMLElement|null;ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const close=(e:Event)=>{if(!ref.current?.contains(e.target as Node))onClose();};
    const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();return;}if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
      e.preventDefault();const buttons=Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]),index=buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus();};
    document.addEventListener('pointerdown',close,true);document.addEventListener('keydown',keyboard);window.addEventListener('resize',onClose);
    return()=>{document.removeEventListener('pointerdown',close,true);document.removeEventListener('keydown',keyboard);window.removeEventListener('resize',onClose);old?.focus();};
  },[onClose]);
  return <div ref={ref} className="quick-menu" role="menu" aria-label="Quick actions" style={{left:position.x,top:position.y}}>{actions.map(item=><React.Fragment key={item.label}>{item.breakBefore&&<div role="separator"/>}<button role={item.checked===undefined?'menuitem':'menuitemcheckbox'} aria-checked={item.checked} disabled={item.disabled} onClick={()=>{onClose();item.run();}}><span>{item.label}</span>{item.checked!==undefined&&<span aria-hidden="true">{item.checked?'✓':''}</span>}</button></React.Fragment>)}</div>;
}
