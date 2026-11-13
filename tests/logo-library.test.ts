import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/worldvectorlogo.mts';
import {logoCatalog} from '../services/logoCatalog.ts';
const request=(slug:string)=>new Request('https://example.netlify.app/.netlify/functions/worldvectorlogo?slug='+slug);
test('curated proxy rejects arbitrary queries, protects the key, caches SVGs, and backs off on 429',async()=>{
  const originalFetch=globalThis.fetch;
  let key:string|undefined,calls=0;
  (globalThis as any).Netlify={env:{get:()=>key}};
  try{
    globalThis.fetch=async()=>{calls++;throw new Error('No upstream request expected');};
    assert.equal((await handler(request('unbounded-search'))).status,400);
    assert.equal((await handler(request(logoCatalog[0].slug))).status,503);
    assert.equal(calls,0);
    key='private-test-key';
    globalThis.fetch=async(url,init)=>{
      calls++;
      assert.equal(String(url),'https://worldvectorlogo.com/api/v1/logos/'+logoCatalog[0].slug);
      assert.equal((init!.headers as any).Authorization,'Bearer private-test-key');
      return Response.json({data:{svg_content:'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L10 10"/></svg>'}});
    };
    const results=await Promise.all([handler(request(logoCatalog[0].slug)),handler(request(logoCatalog[0].slug))]);
    assert.equal(calls,1);
    for(const response of results){assert.equal(response.status,200);const body=await response.text();assert.match(body,/<svg/);assert.ok(!body.includes(key));}
    assert.equal((await handler(request(logoCatalog[0].slug))).status,200);
    assert.equal(calls,1);
    globalThis.fetch=async()=>{calls++;return Response.json({error:{code:'rate_limit_exceeded',retry_after:120}}, {status:429});};
    assert.equal((await handler(request(logoCatalog[1].slug))).status,429);
    assert.equal((await handler(request(logoCatalog[2].slug))).status,429);
    assert.equal(calls,2,'429 must stop further calls during cooldown');
    assert.equal((await handler(request(logoCatalog[0].slug))).status,200,'successful cached SVG survives rate limit');
  }finally{globalThis.fetch=originalFetch;delete (globalThis as any).Netlify;}
});
