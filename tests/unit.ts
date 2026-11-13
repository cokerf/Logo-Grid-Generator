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
