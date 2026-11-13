import {logoCatalog} from '../../services/logoCatalog.ts';
declare const Netlify: { env: { get(name:string):string|undefined } };
const memory=new Map<string,{svg:string;expires:number}>();
const pending=new Map<string,Promise<Response>>();
let cooldown=0;
const json=(body:unknown,status=200,cache=false)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':cache?'public, max-age=86400, stale-while-revalidate=604800':'no-store',...(cache?{'Netlify-CDN-Cache-Control':'public, durable, max-age=604800','Netlify-Vary':'query=slug'}:{})}});
export default async (request:Request) => {
  if(request.method!=='GET')return json({error:'method_not_allowed'},405);
  const slug=new URL(request.url).searchParams.get('slug')||'';
  if(!logoCatalog.some(logo=>logo.slug===slug))return json({error:'unknown_logo'},400);
  const cached=memory.get(slug);
  if(cached&&cached.expires>Date.now())return json({svg:cached.svg},200,true);
  const key=Netlify.env.get('WORLDVECTORLOGO_API_KEY');
  if(!key)return json({error:'not_configured'},503);
  if(Date.now()<cooldown)return json({error:'rate_limited'},429);
  if(pending.has(slug))return (await pending.get(slug)!).clone();
  const task=(async()=>{
    try {
      const response=await fetch(`https://worldvectorlogo.com/api/v1/logos/${slug}`,{headers:{Authorization:`Bearer ${key}`,Accept:'application/json'},signal:AbortSignal.timeout(12000)});
      if(response.status===429){
        const body=await response.json().catch(()=>null);
        const error=body?.error;
        const reset=Date.parse(error?.resets_at||'');
        const wait=error?.code==='insufficient_credits'&&Number.isFinite(reset)?Math.max(60000,reset-Date.now()):Math.max(60000,Number(error?.retry_after||response.headers.get('Retry-After')||60)*1000);
        cooldown=Date.now()+Math.min(wait,31*86400000);
        return json({error:'rate_limited'},429);
      }
      if(!response.ok)return json({error:response.status===401?'invalid_credentials':'provider_unavailable'},502);
      const payload=await response.json();
      const svg=payload?.data?.svg_content||payload?.svg_content;
      if(typeof svg!=='string'||svg.length>5000000||!/<svg[\s>]/i.test(svg))return json({error:'invalid_logo'},502);
      memory.set(slug,{svg,expires:Date.now()+7*86400000});
      return json({svg},200,true);
    }catch{return json({error:'provider_unavailable'},502);}
  })();
  pending.set(slug,task);
  try{return (await task).clone();}finally{pending.delete(slug);}
};
