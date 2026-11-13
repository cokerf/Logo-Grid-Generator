"use strict";
// Logo Grid Generator — Coker Oluwafemi. Affinity by Canva 3.3.1+ scripting add-on.
// Uses the supported JavaScript SDK. No network access or external loader is required.
(function main() {
  const { Document } = require("/document.js");
  const { Dialog, DialogResult } = require("/dialog.js");
  const { Curve, PolyCurve } = require("/geometry.js");
  const { PolyCurveNodeDefinition } = require("/nodes.js");
  const { AddChildNodesCommandBuilder } = require("/commands.js");
  const { FillDescriptor } = require("/fills.js");
  const { LineStyleDescriptor } = require("/linestyle.js");
  const { RGB8 } = require("/colours.js");
  const { BlendMode } = require("affinity:common");
  const doc = Document.current;
  if (!doc || !doc.selection.length)
    throw new Error("Open a document and select your logo curve layers first.");
  const nodes = [],
    seen = [];
  function collect(node) {
    if (seen.some((other) => other.isSameNode(node))) return;
    seen.push(node);
    if (node.isPolyCurveNode) nodes.push(node);
    else for (const child of node.children || []) collect(child);
  }
  for (const node of doc.selection.nodes) collect(node);
  if (!nodes.length)
    throw new Error(
      "Select curve layers or a group containing curves. Convert a copy of shapes or text to curves first.",
    );
  const curves = [];
  for (const node of nodes) {
    const poly = node.polyCurve.clone().transform(node.localToSpreadTransform);
    for (const curve of poly) if (!curve.isEmpty) curves.push(curve);
  }
  if (!curves.length) throw new Error("No curve geometry was found.");
  const all = PolyCurve.create();
  for (const curve of curves) all.addCurve(curve);
  const bounds = all.getExactBoundingBox();
  if (!bounds || !Number.isFinite(bounds.width + bounds.height))
    throw new Error("The selection bounds are invalid.");
  const scale = Math.max(bounds.width, bounds.height, 1),
    weight = scale / 900,
    marker = scale / 230;
  const dialog = Dialog.create("Logo Grid Generator");
  const group = dialog.addColumn().addGroup("Construction layers");
  group.addStaticText(
    "",
    "Adds editable construction layers in one undo step. Source artwork stays intact.",
  );
  const toggles = {
    grid: group.addCheckBox("Canvas grid", true),
    trace: group.addCheckBox("Bézier trace", true),
    anchors: group.addCheckBox("Anchor points and handles", true),
    curvature: group.addCheckBox("Curvature comb", false),
    spines: group.addCheckBox("Tangent spines", false),
    circles: group.addCheckBox("Radius circles", false),
  };
  group.addStaticText(
    "",
    "For SVG text, arbitrary canvas sizes and MP4, use the generator.html included in the download.",
  );
  const result = dialog.runModal();
  if (
    (result && result.value !== undefined ? result.value : result) !==
    DialogResult.Ok.value
  )
    return;
  const enabled = {};
  for (const key of Object.keys(toggles)) enabled[key] = toggles[key].value;
  if (!Object.values(enabled).some(Boolean)) return;
  const layers = {};
  function layer(key) {
    return layers[key] || (layers[key] = PolyCurve.create());
  }
  let count = 0;
  function add(key, curve) {
    if (++count > 30000)
      throw new Error(
        "This selection is too complex. Select fewer curve layers.",
      );
    layer(key).addCurve(curve);
  }
  function line(key, a, b) {
    add(key, Curve.createLine(a, b));
  }
  function dot(p) {
    add(
      "Anchor points and handles",
      Curve.createRectangle({
        x: p.x - marker / 2,
        y: p.y - marker / 2,
        width: marker,
        height: marker,
      }),
    );
  }
  if (enabled.grid) {
    const pad = scale * 0.15,
      x = bounds.x - pad,
      y = bounds.y - pad,
      w = bounds.width + pad * 2,
      h = bounds.height + pad * 2,
      step = scale / 20;
    for (let i = 0; i <= Math.ceil(w / step); i++) {
      const xx = Math.min(x + w, x + i * step);
      line("Canvas grid", { x: xx, y }, { x: xx, y: y + h });
    }
    for (let i = 0; i <= Math.ceil(h / step); i++) {
      const yy = Math.min(y + h, y + i * step);
      line("Canvas grid", { x, y: yy }, { x: x + w, y: yy });
    }
  }
  for (const curve of curves) {
    if (enabled.trace) add("Bézier trace", curve.clone());
    // Iterate on-curve indices, including a closed path's final segment.
    let index = curve.firstOnCurvePointIndex,
      visits = 0;
    while (index >= 0 && visits++ <= curve.pointCount) {
      const next = curve.getNextOnCurvePointIndex(index, true);
      if (next < 0 || next === index) break;
      const b = curve.getCubicBezier(index),
        p = [b.start, b.c1, b.c2, b.end];
      if (enabled.anchors) {
        dot(p[0]);
        dot(p[3]);
        line("Anchor points and handles", p[0], p[1]);
        line("Anchor points and handles", p[3], p[2]);
      }
      for (let i = 0; i <= 12; i++) {
        const t = i / 12,
          q = 1 - t;
        const x =
          q * q * q * p[0].x +
          3 * q * q * t * p[1].x +
          3 * q * t * t * p[2].x +
          t * t * t * p[3].x;
        const y =
          q * q * q * p[0].y +
          3 * q * q * t * p[1].y +
          3 * q * t * t * p[2].y +
          t * t * t * p[3].y;
        const dx =
          3 * q * q * (p[1].x - p[0].x) +
          6 * q * t * (p[2].x - p[1].x) +
          3 * t * t * (p[3].x - p[2].x);
        const dy =
          3 * q * q * (p[1].y - p[0].y) +
          6 * q * t * (p[2].y - p[1].y) +
          3 * t * t * (p[3].y - p[2].y);
        const ddx =
          6 * q * (p[2].x - 2 * p[1].x + p[0].x) +
          6 * t * (p[3].x - 2 * p[2].x + p[1].x);
        const ddy =
          6 * q * (p[2].y - 2 * p[1].y + p[0].y) +
          6 * t * (p[3].y - 2 * p[2].y + p[1].y);
        const speed = Math.hypot(dx, dy);
        if (speed < 1e-8) continue;
        const tx = dx / speed,
          ty = dy / speed,
          nx = -ty,
          ny = tx,
          k = (dx * ddy - dy * ddx) / (speed * speed * speed);
        if (enabled.curvature && Math.abs(k) > 1e-8) {
          const length = Math.max(
            -scale * 0.15,
            Math.min(scale * 0.15, k * scale * scale * 0.015),
          );
          line(
            "Curvature comb",
            { x, y },
            { x: x - nx * length, y: y - ny * length },
          );
        }
        if (i % 4 === 0) {
          if (enabled.spines)
            line(
              "Tangent spines",
              { x: x - tx * scale * 0.04, y: y - ty * scale * 0.04 },
              { x: x + tx * scale * 0.04, y: y + ty * scale * 0.04 },
            );
          const r = 1 / k;
          if (
            enabled.circles &&
            Number.isFinite(r) &&
            Math.abs(r) > scale * 0.01 &&
            Math.abs(r) < scale * 0.7
          ) {
            const radius = Math.abs(r),
              cx = x + nx * r,
              cy = y + ny * r;
            add(
              "Radius circles",
              Curve.createEllipse({
                x: cx - radius,
                y: cy - radius,
                width: 2 * radius,
                height: 2 * radius,
              }),
            );
          }
        }
      }
      if (next === curve.firstOnCurvePointIndex) break;
      index = next;
    }
  }
  const command = AddChildNodesCommandBuilder.create();
  command.setInsertionTarget(doc.currentSpread);
  const noFill = FillDescriptor.createNone();
  for (const name of Object.keys(layers)) {
    const grid = name === "Canvas grid",
      fill = FillDescriptor.createSolid(
        grid ? RGB8(175, 177, 183) : RGB8(117, 97, 223),
        BlendMode.Normal,
      );
    const definition = PolyCurveNodeDefinition.create(
      layers[name],
      noFill,
      fill,
      LineStyleDescriptor.createDefault(grid ? weight * 0.45 : weight),
      noFill,
    );
    definition.userDescription = "Logo Grid / " + name;
    command.addPolyCurveNode(definition);
  }
  // All geometry is prepared before this single, reversible document mutation.
  doc.executeCommand(command.createCommand(false));
})();
