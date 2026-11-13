import {logoCatalog,logoEndpoint} from './logoCatalog.ts';
const cache=new Map<string,{svg:string;expires:number}>();
let blockedUntil=0;
export class LogoLibraryError extends Error {
  constructor(public reason:string){super(reason);}
}
export async function fetchCuratedLogo(slug:string,signal?:AbortSignal,refresh=false) {
  if(!logoCatalog.some(logo=>logo.slug===slug))throw new LogoLibraryError('unknown_logo');
  let saved=cache.get(slug);
  try{saved ||= JSON.parse(localStorage.getItem('logo-grid-library-'+slug)||'null');}catch{}
  if(!refresh&&saved&&saved.expires>Date.now()&&typeof saved.svg==='string'&&saved.svg.length<=5000000){cache.set(slug,saved);return saved.svg;}
  if(blockedUntil>Date.now())throw new LogoLibraryError('rate_limited');
  // Bundled/offline and Figma versions retain the local fallback without sending cross-origin credentials.
  if(window.location.hostname!=='logo-grid-generator.netlify.app'&&!window.location.hostname.endsWith('.netlify.app')&&window.location.hostname!=='localhost')throw new LogoLibraryError('web_only');
  const response=await fetch(new URL(logoEndpoint).pathname+'?slug='+encodeURIComponent(slug),{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
  if(!response.ok){
    const body=await response.json().catch(()=>null);
    if(response.status===429)blockedUntil=Date.now()+5*60000;
    throw new LogoLibraryError(body?.error||'unavailable');
  }
  const body=await response.json();
  if(typeof body.svg!=='string'||body.svg.length>5000000||!/<svg[\s>]/i.test(body.svg))throw new LogoLibraryError('invalid_logo');
  const value={svg:body.svg,expires:Date.now()+7*86400000};cache.set(slug,value);
  try{localStorage.setItem('logo-grid-library-'+slug,JSON.stringify(value));}catch{}
  return value.svg;
}
