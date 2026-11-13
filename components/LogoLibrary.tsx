import React,{useEffect,useRef,useState} from 'react';
import {logoCatalog} from '../services/logoCatalog';
import {fetchCuratedLogo,LogoLibraryError} from '../services/logoLibrary';
export function LogoLibrary({onLoad,onFallback}:{onLoad:(svg:string,name:string)=>Promise<unknown>;onFallback:(message:string)=>void}) {
  const [open,setOpen]=useState(false),[loading,setLoading]=useState(''),[selected,setSelected]=useState(''),[status,setStatus]=useState('');
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  const choose=async(slug:string)=>{
    controller.current?.abort();const task=new AbortController();controller.current=task;
    setLoading(slug);setStatus('');
    try{
      const svg=await fetchCuratedLogo(slug,task.signal);
      if(task.signal.aborted)return;
      const logo=logoCatalog.find(l=>l.slug===slug)!;
      const result=await onLoad(svg,`WorldVectorLogo / ${logo.name}`);
      if(result===false)throw new LogoLibraryError('unsupported_svg');
      setSelected(slug);setStatus(`${logo.name} loaded.`);
    }catch(error){
      if(task.signal.aborted)return;
      const reason=error instanceof LogoLibraryError?error.reason:'';
      const message=reason==='not_configured'?'Logo library is awaiting its API key. Your Coker logo is ready.':reason==='rate_limited'?'WorldVectorLogo is rate-limited. Switched to your Coker logo.':reason==='web_only'?'Open the Netlify app to use the brand library. Your Coker logo is ready.':'This logo is unavailable. Switched to your Coker logo.';
      setSelected('');setStatus(message);onFallback(message);
    }finally{if(controller.current===task)setLoading('');}
  };
  return <div className="logo-library">
    <button className="library-trigger flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]" aria-expanded={open} aria-controls="curated-logo-library" onClick={()=>setOpen(!open)}><span><strong>Logo library</strong><small>Your mark + 12 selected brands</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={open?'rotate-180 transition-transform':'transition-transform'} aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    {open&&<div id="curated-logo-library" className="mt-3 grid grid-cols-3 gap-2">
      <button className={`library-item ${!selected?'selected':''}`} onClick={()=>{controller.current?.abort();setLoading('');setSelected('');setStatus('Coker logo loaded.');onFallback('Coker logo loaded.');}}><strong>Coker</strong><small>Local original</small></button>
      {logoCatalog.map(logo=><button key={logo.slug} aria-pressed={selected===logo.slug} className={`library-item ${selected===logo.slug?'selected':''}`} onClick={()=>void choose(logo.slug)}><strong>{loading===logo.slug?'Loading…':logo.name}</strong><small>{logo.kind}</small></button>)}
      <a className="library-attribution col-span-3" href="https://worldvectorlogo.com/" target="_blank" rel="noreferrer">Brand vectors from WorldVectorLogo</a>
    </div>}
    {status&&<p className="hint" role="status">{status}</p>}
  </div>;
}
