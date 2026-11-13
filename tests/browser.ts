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
    doc.querySelectorAll("[data-logo]").length === 2,
    "Example logo did not render",
  );
  const buttons = () => Array.from(doc.querySelectorAll("button"));
  const click = async (label: string) => {
    const b = buttons().find((b) => b.textContent?.trim() === label);
    assert(b, "Missing control " + label);
    b!.click();
    await new Promise((r) => setTimeout(r, 80));
  };
  const curvature = Array.from(doc.querySelectorAll("label"))
    .find((l) => l.textContent?.trim() === "Curvature comb")
    ?.querySelector("input");
  assert(curvature, "Missing curvature toggle");
  curvature!.click();
  await new Promise((r) => setTimeout(r, 80));
  assert(
    doc.querySelector('[data-stage="3"] path'),
    "Curvature layer did not render",
  );
  await click("Style");
  await click("Blueprint");
  assert(
    doc.querySelector(".artboard svg"),
    "Canvas disappeared after theme change",
  );
  await click("Construction");
  assert(
    doc.querySelector('img[alt="Construction animation preview"]'),
    "Construction preview missing",
  );
  const img = doc.querySelector("img")!;
  await img.decode();
  assert(img.naturalWidth > 0, "Preview SVG is invalid");
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
