import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePathD, segmentsToD } from "../services/svgParser.ts";
import { analyzePath } from "../services/geometry.ts";
import { validateDimensions } from "../services/exporter.ts";
test("compact, repeated and relative SVG coordinates", () => {
  const p = parsePathD("m1e1 10 20-5 10 15h20 10v10 20");
  assert.deepEqual(p.points, [
    { x: 10, y: 10 },
    { x: 30, y: 5 },
    { x: 40, y: 20 },
    { x: 60, y: 20 },
    { x: 70, y: 20 },
    { x: 70, y: 30 },
    { x: 70, y: 50 },
  ]);
  assert.deepEqual(parsePathD(segmentsToD(p.segments)).segments, p.segments);
});
test("smooth cubic commands do not reflect quadratic controls", () => {
  const p = parsePathD("M0 0Q10 20 20 0S30 20 40 0");
  assert.deepEqual(p.segments[2].values.slice(0, 2), [20, 0]);
});
test("arcs become editable cubic curves", () => {
  const p = parsePathD("M0 0a50 50 0 1 0 100 0");
  assert.ok(p.handles.length >= 4);
  assert.ok(p.segments.every((s) => s.command !== "A"));
});
test("close-path restores the subpath origin before relative movement", () => {
  const p = parsePathD("M10 20l30 0l0 30zm5 5l10 0");
  assert.deepEqual(p.points.slice(-2), [
    { x: 15, y: 25 },
    { x: 25, y: 25 },
  ]);
});
test("Paper.js yields finite curvature and correctly centered local circles", () => {
  const a = analyzePath(
    "M0 50C0 22.3858 22.3858 0 50 0S100 22.3858 100 50S77.6142 100 50 100S0 77.6142 0 50Z",
    140,
    36,
    1,
  );
  assert.ok(a.comb && a.envelope && a.spines.length && a.circles.length);
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(a)));
  assert.ok(
    a.circles.every((c) => Math.abs(c.x - 50) < 3 && Math.abs(c.y - 50) < 3),
  );
});
test("straight paths have tangents and no invented curvature", () => {
  const a = analyzePath("M0 0L100 0", 100, 36, 1);
  assert.equal(a.comb, "");
  assert.equal(a.circles.length, 0);
  assert.ok(a.spines.length > 0);
});
test("MP4 dimensions are finite whole even pixel counts within the canvas budget", () => {
  validateDimensions(1080, 1350, true);
  validateDimensions(3840, 2160, true);
  for (const [w, h] of [
    [0, 100],
    [100.5, 100],
    [8194, 100],
    [1081, 1350],
    [Infinity, 100],
    [8192, 8192],
  ])
    assert.throws(() => validateDimensions(w, h, true));
});

test("canvas viewport expands to portrait and landscape without scaling the logo", async () => {
  const { canvasViewport } = await import("../services/canvasViewport.ts");
  assert.deepEqual(canvasViewport("0 0 100 100", 2), {
    x: -50,
    y: 0,
    width: 200,
    height: 100,
  });
  assert.deepEqual(canvasViewport("0 0 100 100", 0.5), {
    x: 0,
    y: -50,
    width: 100,
    height: 200,
  });
});

test("all motion presets settle exactly and keep finite camera values", async () => {
  const { cameraAt, motionPresets } = await import("../services/motion.ts");
  for (const preset of motionPresets) {
    for (let n = 0; n <= 100; n++) {
      const c = cameraAt(preset.id, n / 100);
      assert.ok(Object.values(c).every(Number.isFinite));
      assert.ok(c.zoom >= 1);
    }
    assert.deepEqual(cameraAt(preset.id, 1), { zoom: 1, x: 0, y: 0 });
  }
  assert.ok(cameraAt("precision", 0).zoom > 1.5);
  assert.notEqual(cameraAt("tour", 0.15).x, cameraAt("tour", 0.5).x);
});


test("shuffle changes the brand and styles preserve export-safe density and contrast",async()=>{
  const {shuffledSlug,styleVariation}=await import('../services/styleVariation.ts');
  assert.equal(shuffledSlug(['a','b','c'],'a',()=>0),'b');
  assert.equal(shuffledSlug(['a','b','c'],'a',()=>.99),'c');
  assert.equal(shuffledSlug(['a'],'a',()=>0),'a');
  const c={canvasBackground:'#f2f1eb',path:{},anchors:{},handles:{},outlines:{},gridlines:{},rulers:{},elementGuides:{},alignmentGuides:{},guides:{}} as any;
  const a={samples:36,gain:1} as any;
  const v={rulers:true,snap:false} as any;
  for(const scale of [1,300,5000])for(const seed of [0,.3,.7,.99]){
    const variation=styleVariation(c,a,v,scale,900,()=>seed);
    assert.notEqual(variation.customization.canvasBackground,c.canvasBackground);
    assert.equal(variation.customization.showFill,false);
    assert.equal(variation.customization.useOriginalColors,false);
    assert.equal(variation.visibility.rulers,true);
    assert.equal(variation.visibility.anchors,false);
    assert.equal(variation.visibility.handles,false);
    assert.equal(variation.analysis.spines,false);
    assert.ok(variation.customization.path.strokeWidth>0);
    assert.notEqual(variation.customization.path.stroke,variation.customization.canvasBackground);
  }
});

test("construction extensions meet canvas edges without vertical or diagonal singularities",async()=>{
  const {extendLine}=await import('../services/drafting.ts');
  const box={x:-100,y:-50,width:400,height:300};
  assert.deepEqual(extendLine({x:0,y:0},{x:0,y:1},box),{a:{x:0,y:-50},b:{x:0,y:250}});
  assert.deepEqual(extendLine({x:0,y:0},{x:1,y:0},box),{a:{x:-100,y:0},b:{x:300,y:0}});
  const diagonal=extendLine({x:0,y:0},{x:1,y:1},box)!;
  for(const p of [diagonal.a,diagonal.b]){assert.equal(p.x,p.y);assert.ok(p.x===box.x||p.x===300||p.y===box.y||p.y===250);}
  assert.equal(extendLine({x:0,y:0},{x:0,y:0},box),null);
  assert.equal(extendLine({x:500,y:0},{x:0,y:1},box),null);
});
test("guide geometry follows straight SVG edges, spans the viewport, and stays bounded",async()=>{
  const {draftingLines,defaultDrafting,measurementSplits}=await import('../services/drafting.ts');
  const p=parsePathD('M0 100L80 0H160L80 100Z');
  const data={width:220,height:160,viewBox:'-30 -30 220 160',rawSVG:'',paths:[{...p,d:segmentsToD(p.segments),boundingBox:{x:0,y:0,width:160,height:100}}]} as any;
  const box={x:-100,y:-100,width:400,height:300};
  const diagonal=draftingLines(data,box,{...defaultDrafting,guideAxes:'diagonal',diagonalSource:'edges'});
  assert.equal(diagonal.length,2,'parallel logo edges must produce separate extensions');
  for(const line of diagonal){assert.ok(Math.abs((line.b.y-line.a.y)/(line.b.x-line.a.x)+1.25)<1e-9);}
  const lines=draftingLines(data,box,{...defaultDrafting,guideAxes:'both',guideLimit:4,proportions:true,measureSplits:'24,30'});
  assert.ok(lines.length<=12);
  assert.ok(lines.flatMap(l=>[l.a.x,l.a.y,l.b.x,l.b.y]).every(Number.isFinite));
  assert.deepEqual(measurementSplits('30,24,24,NaN,-4,101'),[0,24,30,100]);
});


test("curated logo preparation removes only known EPS backing rectangles",async()=>{
  const {prepareLibrarySVG}=await import('../services/logoPreparation.ts');
  const source='<svg><path fill="#fff" d="M0 0h192.756v192.756H0V0z"/><path fill="#fff" d="M10 10H20V20Z"/><path d="M1 2L3 4"/></svg>';
  const clean=prepareLibrarySVG('adidas',source);
  assert.ok(!clean.includes('192.756'));
  assert.ok(clean.includes('M10 10H20V20Z'));
  assert.ok(clean.includes('M1 2L3 4'));
  assert.equal(prepareLibrarySVG('puma-logo',source),source);
});


test("cloned SVG references follow unique IDs without changing colours or external resources",async()=>{
  const {rewriteSVGReference}=await import('../services/svgReferences.ts');
  const ids=new Map([['trace','preview-1'],['hatch','preview-2'],['fff','preview-3']]);
  assert.equal(rewriteSVGReference('href','#trace',ids),'#preview-1');
  assert.equal(rewriteSVGReference('xlink:href','#trace',ids),'#preview-1');
  assert.equal(rewriteSVGReference('fill','url(#hatch)',ids),'url(#preview-2)');
  assert.equal(rewriteSVGReference('style',"fill:url('#hatch');stroke:#fff",ids),'fill:url(#preview-2);stroke:#fff');
  assert.equal(rewriteSVGReference('fill','#fff',ids),'#fff');
  assert.equal(rewriteSVGReference('href','https://example.test/#trace',ids),'https://example.test/#trace');
  assert.equal(rewriteSVGReference('src','url(data:font/woff2;base64,AAAA)',ids),'url(data:font/woff2;base64,AAAA)');
});

test("measured guides derive actual gaps inside compound paths and do not invent percentage splits",async()=>{
  const {measureComponents}=await import('../services/measurements.ts');
  const {draftingLines,defaultDrafting}=await import('../services/drafting.ts');
  const d='M0 0H30V50H0Z M40 0H65V50H40Z M75 0H100V50H75Z M5 5V45H25V5Z';
  const p=parsePathD(d),data={width:140,height:90,viewBox:'-20 -20 140 90',rawSVG:'',paths:[{...p,d,fillRule:'nonzero',boundingBox:{x:0,y:0,width:100,height:50}}]} as any;
  const measurement=measureComponents(data);
  assert.deepEqual(measurement.x.map(r=>[r.start,r.end,r.kind]),[[0,30,'shape'],[30,40,'gap'],[40,65,'shape'],[65,75,'gap'],[75,100,'shape']]);
  const lines=draftingLines(data,{x:-20,y:-20,width:140,height:90},{...defaultDrafting,proportions:true,guideAxes:'orthogonal',measureSplits:''});
  const xs=lines.filter(l=>l.a.x===l.b.x).map(l=>l.a.x);
  assert.deepEqual(xs,[0,30,40,65,75,100]);
  assert.ok(!xs.includes(24));
});
test("wordmark row gaps remain measurable when an overhead symbol spans the same x positions",async()=>{
  const {measureComponents}=await import('../services/measurements.ts');
  const d='M0 0H100V15H0Z M0 40H25V70H0Z M35 40H60V70H35Z M70 40H100V70H70Z';
  const data={width:140,height:110,paths:[{...parsePathD(d),d,fillRule:'nonzero'}]} as any;
  const m=measureComponents(data);
  assert.deepEqual(m.x.filter(r=>r.kind==='gap').map(r=>[r.start,r.end]),[[25,35],[60,70]]);
  assert.deepEqual(m.y.filter(r=>r.kind==='gap').map(r=>[r.start,r.end]),[[15,40]]);
});
test("tangent spines extend outside both sides of the canvas frame",()=>{
  const a=analyzePath('M0 0L100 100',100,20,1,{x:-20,y:-20,width:140,height:140});
  assert.ok(a.spines.length>0);
  for(const spine of a.spines){const points=parsePathD(spine).points;assert.ok(points.some(p=>p.x< -20&&p.y< -20));assert.ok(points.some(p=>p.x>120&&p.y>120));}
});
test("colour palettes maintain readable logo contrast against their backgrounds",async()=>{
  const {studioPalettes}=await import('../services/styleVariation.ts');
  const luminance=(hex:string)=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
  for(const palette of studioPalettes){const a=luminance(palette.background),b=luminance(palette.ink);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,palette.name);}
});

test("enclosing frames and nested counters do not conceal internal wordmark gaps",async()=>{
  const {measureComponents}=await import('../services/measurements.ts');
  const d='M0 0H100V100H0Z M5 5H95V95H5Z M20 40H30V60H20Z M40 40H50V60H40Z M60 40H70V60H60Z';
  const data={width:140,height:140,paths:[{...parsePathD(d),d,fillRule:'evenodd'}]} as any;
  const m=measureComponents(data);
  assert.deepEqual(m.x.filter(r=>r.kind==='gap').map(r=>[r.start,r.end]),[[30,40],[50,60]]);
  assert.ok(m.xGuides.includes(0)&&m.xGuides.includes(100));
});

import {prepareMorph,morphProgress,defaultMorph} from '../services/morph.ts';
import type {ParsedSVG} from '../types';
function morphFixture(ds:string[]):ParsedSVG{return {rawSVG:'',viewBox:'0 0 100 100',width:100,height:100,paths:ds.map(d=>({d,...parsePathD(d),boundingBox:{x:0,y:0,width:100,height:100} as SVGRect}))};}
test('morph pairs unequal compound contours, keeps endpoints exact and remains finite',()=>{
  const a=morphFixture(['M0 0L100 0L100 100L0 100Z M20 20L20 80L80 80L80 20Z']);
  const b=morphFixture(['M50 0C100 0 100 100 50 100C0 100 0 0 50 0Z','M10 10L20 10L20 20Z']);
  const frame=prepareMorph(a,b);
  assert.equal(frame(0).paths.length,1);assert.equal(frame(1).paths.length,2);
  assert.ok(frame(0).paths[0].d.includes('1000'));
  for(const t of [0,.001,.25,.5,.75,.999,1])assert.ok(!/NaN|Infinity/.test(JSON.stringify(frame(t))));
  assert.notEqual(frame(.25).paths[0].d,frame(.75).paths[0].d);
  assert.equal(frame(.5).paths[0].fillRule,'evenodd');
  assert.ok(frame(.5).paths[0].d.includes('C'));
  assert.ok(frame(.5).paths[0].handles.length>0);
});
test('morph timing holds endpoints, reverses and returns for a loop',()=>{
  assert.equal(morphProgress(.1,defaultMorph),0);assert.equal(morphProgress(.9,defaultMorph),1);
  assert.equal(morphProgress(.5,defaultMorph),.5);
  assert.equal(morphProgress(0,{...defaultMorph,direction:'reverse'}),1);
  assert.equal(morphProgress(1,{...defaultMorph,direction:'roundtrip'}),0);
  assert.equal(morphProgress(.5,{...defaultMorph,direction:'roundtrip'}),1);
});
test('morph matches open paths without closing them',()=>{
  const frame=prepareMorph(morphFixture(['M0 0L100 100']),morphFixture(['M100 0L0 100']));
  assert.ok(!frame(.5).paths[0].d.includes('Z'));
});
test('morph keeps live textPath definitions distinct and cross-dissolves lettering',()=>{
  const make=(text:string):ParsedSVG=>({...morphFixture([]),definitions:'<path id="arc" d="M0 0L100 100"/>',texts:[{markup:`<text><textPath href="#arc">${text}</textPath></text>`,boundingBox:{x:0,y:0,width:100,height:100} as SVGRect}]});
  const frame=prepareMorph(make('OLD'),make('NEW'))(.5);
  assert.equal(frame.paths.length,0);
  assert.equal(frame.texts?.length,2);
  assert.ok(frame.definitions?.includes('id="morph-from-arc"'));
  assert.ok(frame.definitions?.includes('id="morph-to-arc"'));
  assert.ok(frame.texts?.[0].markup.includes('opacity="0.5"'));
  assert.ok(frame.texts?.[1].markup.includes('href="#morph-to-arc"'));
});
test('random styles never enable tangent spines, including when they were enabled manually',async()=>{
  const {styleVariation}=await import('../services/styleVariation.ts');
  const c={canvasBackground:'#fff',path:{},anchors:{},handles:{},outlines:{},gridlines:{},rulers:{},elementGuides:{},alignmentGuides:{},guides:{}} as any;
  for(const complexity of [10,900])for(let seed=0;seed<100;seed++)assert.equal(styleVariation(c,{spines:true} as any,{} as any,1000,complexity,()=>seed/100).analysis.spines,false);
});
