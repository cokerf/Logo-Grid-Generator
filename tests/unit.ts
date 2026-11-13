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
