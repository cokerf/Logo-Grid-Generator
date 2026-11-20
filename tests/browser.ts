import {createComparisonSVG,defaultComparison} from '../services/comparison';
import {importSVG} from '../services/svgImport';
import clippedFixture from './fixtures/clipped-symbol-mask.svg?raw';
import letteringFixture from './fixtures/live-lettering.svg?raw';
import { parsePathD, parseSVG } from "../services/svgParser";
import { analyzePath } from "../services/geometry";
import {
  applyConstruction,
  makeExportSVG,
  exportMP4,
  validateDimensions,
  type ExportSettings,
} from "../services/exporter";
const results: { name: string; passed: boolean; error?: string }[] = [];
const assert = (value: unknown, message: string) => {
  if (!value) throw new Error(message);
};
async function test(name: string, fn: () => unknown | Promise<unknown>) {
  await fetch("/__test-progress", { method: "POST", body: "Testing: " + name });
  try {
    await fn();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: String(e) });
  }
}
await test("Automatically prepare clipped symbols and masks without manual expansion",async()=>{
  const parsed=await importSVG(clippedFixture);
  assert(parsed.paths.length>0&&parsed.paths[0].d.includes('C'),'Visible artwork was not traced');
  assert(parsed.renderedArtwork?.startsWith('data:image/png'),'Original appearance was not retained');
  assert(parsed.paths[0].fillRule==='evenodd','Mask hole must stay open');
  const bounds=parsed.paths[0].boundingBox!;
  assert(bounds.width>1300&&bounds.width<1600,'Clip silhouette was ignored');
});
await test("Prepare unexpanded textPath lettering for a geometric morph",async()=>{
  const parsed=await importSVG(letteringFixture,undefined,'',true);
  assert(parsed.paths.length>0&&!parsed.texts?.length,'Lettering did not become morphable contours');
  assert(parsed.paths[0].points.length>20,'Glyph contours are missing');
});
await test("Comparison keeps the two original drawings intact in every layout",()=>{
  const left=document.createElementNS('http://www.w3.org/2000/svg','svg'),right=left.cloneNode() as SVGSVGElement;
  left.setAttribute('viewBox','0 0 100 100');right.setAttribute('viewBox','0 0 100 100');
  left.innerHTML='<path data-logo="true" d="M10 10L90 10L50 90Z" fill="#fa3044"/>';
  right.innerHTML='<circle data-logo="true" cx="50" cy="50" r="35" fill="#314aff"/>';
  const settings={width:1080,height:1350,duration:3,fps:24,quality:'high',ending:'hold',includeGuides:true,includeGrid:true,includeRulers:true,transparent:false} as ExportSettings;
  for(const layout of ['side-by-side','wipe','overlay'] as const)for(const t of [0,.5,1]){
    const scene=createComparisonSVG(left,right,settings,{...defaultComparison,layout},t,'#fff','#222');
    assert(scene.querySelector('path')?.getAttribute('d')==='M10 10L90 10L50 90Z','Before geometry was distorted');
    assert(scene.querySelector('circle')?.getAttribute('r')==='35','After geometry was distorted');
    assert(scene.querySelector('path')?.getAttribute('fill')==='#fa3044','Original colour lost');
    assert(scene.querySelectorAll('text').length===2,'Comparison labels missing');
  }
});
const ns = "http://www.w3.org/2000/svg";
await test("Repeated coordinates, compact negative numbers, exponents and relative commands", () => {
  const p = parsePathD("m1e1 10 20-5 10 15h20 10v10 20");
  assert(
    JSON.stringify(p.points) ===
      JSON.stringify([
        { x: 10, y: 10 },
        { x: 30, y: 5 },
        { x: 40, y: 20 },
        { x: 60, y: 20 },
        { x: 70, y: 20 },
        { x: 70, y: 30 },
        { x: 70, y: 50 },
      ]),
    JSON.stringify(p.points),
  );
});
await test("Smooth commands reflect only compatible control points", () => {
  const p = parsePathD("M0 0Q10 20 20 0S30 20 40 0");
  assert(
    p.segments[2].values[0] === 20 && p.segments[2].values[1] === 0,
    "S incorrectly reflected Q",
  );
});
await test("Elliptical arcs become editable cubic geometry", () => {
  const p = parsePathD("M0 0a50 50 0 1 0 100 0");
  assert(
    p.handles.length >= 4 && p.segments.every((s) => s.command !== "A"),
    "Arc was lost",
  );
});
await test("Group transforms and shape conversion preserve bounds", () => {
  const p = parseSVG(
    '<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(40 30) scale(2)"><rect x="0" y="0" width="20" height="10"/><circle cx="30" cy="20" r="5"/></g></svg>',
  );
  assert(p.paths.length === 2, "Missing shapes");
  const b = p.paths[0].boundingBox!;
  assert(
    b.x === 40 && b.y === 30 && b.width === 40 && b.height === 20,
    JSON.stringify(b),
  );
});
await test("Invalid SVG and masked geometry produce actionable errors", () => {
  for (const svg of [
    "<svg><path></svg>",
    '<svg xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#x)"><path d="M0 0L10 10"/></g></svg>',
  ]) {
    let failed = false;
    try {
      parseSVG(svg);
    } catch {
      failed = true;
    }
    assert(failed, "Unsupported geometry accepted");
  }
});
await test("SVG scripts and event handlers are never attached", () => {
  const p = parseSVG(
    '<svg xmlns="http://www.w3.org/2000/svg" onload="window.pwned=1"><script>window.pwned=1</script><path d="M0 0L20 20L20 0Z" onclick="window.pwned=1"/></svg>',
  );
  assert(p.paths.length === 1 && !("pwned" in window), "Unsafe SVG attached");
});
await test("Paper.js curvature produces finite combs, tangents, and local circles", () => {
  const p = analyzePath(
    "M0 50C0 22.3858 22.3858 0 50 0S100 22.3858 100 50S77.6142 100 50 100S0 77.6142 0 50Z",
    140,
    36,
    1,
  );
  assert(
    p.comb.length > 0 && p.spines.length > 0 && p.circles.length > 0,
    "Missing analysis",
  );
  assert(!/NaN|Infinity/.test(JSON.stringify(p)), "Non-finite geometry");
  assert(
    p.circles.every((c) => Math.abs(c.x - 50) < 3 && Math.abs(c.y - 50) < 3),
    "Wrong curvature normal direction",
  );
});
await test("Unexpanded text and textPath remain safe, measurable SVG text", () => {
  const p = parseSVG(
    `<svg xmlns="http://www.w3.org/2000/svg"><style>.lettering{font-family:Arial;font-size:32px;font-weight:700}</style><defs><path id="arc" d="M0 100 Q100 0 200 100"/></defs><g transform="translate(20 30)"><text class="lettering"><textPath href="#arc" startOffset="20%">Coker</textPath></text><text x="40" y="160" font-size="40"><tspan>Live type</tspan></text></g></svg>`,
  );
  assert(
    p.paths.length === 0 && p.texts?.length === 2,
    "Live text was rejected or definitions rendered as artwork",
  );
  assert(
    p.texts.every((t) => t.boundingBox.width > 0 && t.boundingBox.height > 0),
    "Text bounds are empty",
  );
  assert(p.texts[1].boundingBox.height>30,"Unitless SVG font-size was lost");
  assert(
    p.definitions?.includes("path") && p.texts[0].markup.includes("textPath"),
    "Text path reference lost",
  );
  assert(p.texts[0].markup.includes("32px"), "CSS typography was lost");
});
await test("External textPath references are rejected without loading resources", () => {
  let rejected = false;
  try {
    parseSVG(
      '<svg xmlns="http://www.w3.org/2000/svg"><text><textPath href="https://example.com/path.svg#x">No</textPath></text></svg>',
    );
  } catch {
    rejected = true;
  }
  assert(rejected, "External reference accepted");
});
const svg = document.createElementNS(ns, "svg");
svg.setAttribute("viewBox", "0 0 200 200");
svg.innerHTML =
  '<g data-stage="0"><line x1="0" y1="0" x2="200" y2="200" stroke="#cccccc"/></g><path data-stage="4" data-logo="true" d="M40 100C40 20 160 20 160 100S40 180 40 100Z" fill="#335522" stroke="#223311"/><g data-stage="2"><path d="M40 100L40 20M160 20L160 100" fill="none" stroke="#779955"/></g>';
document.body.append(svg);
const settings: ExportSettings = {
  width: 1080,
  height: 1350,
  duration: 3,
  fps: 24,
  quality: "standard",
  includeGuides: true,
  transparent: false,
  ending: "hold",
};
await test("Timeline starts empty, traces geometry, and ends with a visible logo", () => {
  const start = makeExportSVG(svg, settings, "#fafafa");
  applyConstruction(start, 0);
  assert(
    start.querySelector("[data-logo]")?.getAttribute("opacity") === "0",
    "Logo visible at start",
  );
  const mid = makeExportSVG(svg, settings, "#fafafa");
  applyConstruction(mid, 0.4);
  assert(
    mid.querySelector("[data-logo]")?.hasAttribute("stroke-dashoffset"),
    "Logo did not trace",
  );
  const end = makeExportSVG(svg, settings, "#fafafa");
  applyConstruction(end, 1);
  assert(
    end.querySelector("[data-logo]")?.getAttribute("fill-opacity") === "1",
    "Logo incomplete at end",
  );
  const clean = makeExportSVG(svg, settings, "#fafafa");
  applyConstruction(clean, 1, "clean");
  assert(
    clean.querySelector("line")?.getAttribute("opacity") === "0",
    "Construction did not fade",
  );
});
await test("Reject invalid or odd MP4 dimensions", () => {
  for (const dims of [
    [0, 100],
    [100.5, 100],
    [8194, 100],
    [1081, 1350],
  ]) {
    let failed = false;
    try {
      validateDimensions(dims[0], dims[1], true);
    } catch {
      failed = true;
    }
    assert(failed, `Accepted ${dims}`);
  }
});
await test("Workspace renders and construction controls update the visible canvas", async () => {
  const frame = document.createElement("iframe");
  frame.style.cssText = "width:1200px;height:900px";
  document.body.append(frame);
  await new Promise<void>((resolve, reject) => {
    frame.onload = () => resolve();
    frame.onerror = () => reject(new Error("Workspace failed to load"));
    frame.src = "/";
  });
  const doc = frame.contentDocument!;
  for (let n = 0; n < 100 && !doc.querySelector("[data-logo]"); n++)
    await new Promise((r) => setTimeout(r, 50));
  assert(
    doc.querySelectorAll("[data-logo]").length >= 2,
    "Example logo did not render",
  );
  const buttons = () => Array.from(doc.querySelectorAll("button"));
  const click = async (label: string) => {
    const b = buttons().find((b) => b.textContent?.trim() === label);
    assert(b, "Missing control " + label);
    b!.click();
    await new Promise((r) => setTimeout(r, 80));
  };
  await click("Drawing");
  const curvature = Array.from(doc.querySelectorAll("button"))
    .find((b) => b.textContent?.trim() === "Dimension guides");
  assert(curvature, "Missing dimensions toggle");
  curvature!.click();
  await new Promise((r) => setTimeout(r, 80));
  assert(
    doc.querySelector('[data-dimensions] path'),
    "Dimension layer did not render",
  );
  const canvas=doc.querySelector('.artboard svg') as unknown as SVGSVGElement;
  assert(canvas.querySelector('[data-logo]')?.getAttribute('fill')==='none','Logo fill must default off');
  const rulerSettings={width:1080,height:1350,duration:3,fps:24,quality:'high',includeGuides:true,includeRulers:true,transparent:false,ending:'hold'} as ExportSettings;
  const withRulers=makeExportSVG(canvas,rulerSettings,'#101010');
  assert(withRulers.querySelector('[data-export-rulers] text'),'Enabled rulers must export with scale labels');
  assert(!makeExportSVG(canvas,{...rulerSettings,includeRulers:false},'#101010').querySelector('[data-export-rulers]'),'Export ruler toggle must remove rulers');
  canvas.setAttribute('data-rulers','false');
  assert(!makeExportSVG(canvas,rulerSettings,'#101010').querySelector('[data-export-rulers]'),'Hidden canvas rulers must stay absent from exports');
  canvas.setAttribute('data-rulers','true');
  const label=withRulers.querySelector('[data-export-rulers]')!.textContent;
  applyConstruction(withRulers,.2,'hold','precision');
  assert(withRulers.querySelector('[data-export-rulers]')!.textContent!==label,'Export ruler scale should follow camera zoom');
  await click("Style");
  await click("Blueprint");
  assert(
    doc.querySelector(".artboard svg"),
    "Canvas disappeared after theme change",
  );
  await click("Construction");
  assert(
    doc.querySelector('[aria-label="Construction animation preview"]'),
    "Construction preview missing",
  );
  assert(doc.querySelector('[aria-label="Construction animation preview"] svg'),"Preview SVG is missing");
  await click("Export");
  assert(
    buttons().some((b) => b.textContent === "Export MP4"),
    "MP4 export control missing",
  );
  frame.remove();
});
await test("Actual 1080 × 1350 H.264 MP4 encoding", async () => {
  let progress = 0;
  const blob = await exportMP4(
    svg,
    settings,
    "#f2f1eb",
    (p) => (progress = p),
    new AbortController().signal,
  );
  assert(blob.size > 1000 && progress === 1, "Empty or unfinished video");
  const response = await fetch("/__test-video", { method: "POST", body: blob });
  assert(response.ok, "Failed to save test MP4");
});
await test("Video export cancellation aborts cleanly", async () => {
  const controller = new AbortController();
  controller.abort();
  let aborted = false;
  try {
    await exportMP4(svg, settings, "#fff", () => {}, controller.signal);
  } catch (e) {
    aborted = (e as Error).name === "AbortError";
  }
  assert(aborted, "Did not abort");
});
document.body.textContent = JSON.stringify(results, null, 2);
await fetch("/__test-results", {
  method: "POST",
  body: JSON.stringify(results),
});
