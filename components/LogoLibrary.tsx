import React,{useEffect,useRef,useState} from 'react';
import exampleLogo from '../assets/coker-example.svg?raw';
import {logoCatalog} from '../services/logoCatalog';
import {preloadedLogos} from '../services/preloadedLogos';
import {fetchCuratedLogo,LogoLibraryError} from '../services/logoLibrary';
type Load=(svg:string,name:string)=>Promise<unknown>;
function ShuffleIcon(){return <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5h2c4 0 6 10 10 10h3m-3-3 3 3-3 3M2 15h2c1.5 0 2.7-1.4 4-3.3M10 8.3C11.4 6.4 12.5 5 14 5h3m-3-3 3 3-3 3"/></svg>}
const thumbnail=(svg:string)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
export function LogoLibrary({onLoad,onShuffleLoad,onStyle,onFallback,currentName,onShuffle}:{onShuffle:()=>void;onLoad:Load;onShuffleLoad:Load;onStyle:()=>void;onFallback:(message:string)=>void;currentName:string}) {
  const [open,setOpen]=useState(false),[loading,setLoading]=useState('');
  const controller=useRef<AbortController|null>(null);
  const activeName=useRef(currentName);activeName.current=currentName;
  const selected=logoCatalog.find(logo=>currentName===`WorldVectorLogo / ${logo.name}`)?.slug||'';
  useEffect(()=>()=>controller.current?.abort(),[]);
  const fallback=()=>onFallback('');
  const choose=async(slug:string,shuffle=false)=>{
    controller.current?.abort();const task=new AbortController();controller.current=task;
    const logo=logoCatalog.find(l=>l.slug===slug);
    const svg=slug==='coker'?exampleLogo:preloadedLogos[slug];
    if(!svg||(!logo&&slug!=='coker'))return;
    setLoading(slug);
    const name=logo?`WorldVectorLogo / ${logo.name}`:'Example / coker-logo.svg';
    try{
      // A verified local snapshot makes switching instant, with no batch fetch or random API queries.
      const result=await (shuffle?onShuffleLoad:onLoad)(svg,name);
      if(task.signal.aborted)return;
      if(result===false)throw new LogoLibraryError('unsupported_svg');
      if(shuffle||slug==='coker')return;
      const live=await fetchCuratedLogo(slug,task.signal,true);
      if(task.signal.aborted||activeName.current!==name)return;
      if(live!==svg){const loaded=await onLoad(live,name);if(loaded===false)throw new LogoLibraryError('unsupported_svg');}

    }catch(error){if(!task.signal.aborted&&activeName.current===name&&!(error instanceof LogoLibraryError&&error.reason==='web_only'))fallback();
    }finally{if(controller.current===task)setLoading('');}
  };
  const shuffle=()=>{controller.current?.abort();setLoading('');onShuffle();};
  return <div className="logo-library">
    <div className="shuffle-actions"><button className="shuffle-main" disabled={!!loading} onClick={shuffle}><ShuffleIcon/>Shuffle logo & style</button><button className="shuffle-style" disabled={!!loading} onClick={onStyle}><ShuffleIcon/>Shuffle style</button></div>
    <button className="library-trigger flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-hover)]" aria-expanded={open} aria-controls="curated-logo-library" onClick={()=>setOpen(!open)}><span><strong>Logo library</strong><small>Choose a logo</small></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={open?'rotate-180 transition-transform':'transition-transform'} aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
    {open&&<div id="curated-logo-library" className="brand-grid">
      <button className={`library-item brand-item ${currentName.startsWith('Example / coker')?'selected':''}`} onClick={()=>void choose('coker')}><span className="brand-preview"><img src={thumbnail(exampleLogo)} alt=""/></span><strong>Coker</strong></button>
      {logoCatalog.map(logo=><button key={logo.slug} aria-label={`${logo.name} · ${logo.kind}`} aria-pressed={selected===logo.slug} aria-busy={loading===logo.slug} className={`library-item brand-item ${selected===logo.slug?'selected':''}`} onClick={()=>void choose(logo.slug)}><span className="brand-preview"><img src={thumbnail(preloadedLogos[logo.slug])} alt=""/></span><strong>{logo.name}</strong></button>)}

    </div>}

  </div>;
}
