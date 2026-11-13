import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const script = readFileSync(
  new URL("../affinity/Logo-Grid-Generator.js", import.meta.url),
  "utf8",
);
function host({ cancel = false, selected = true } = {}) {
  const records = { writes: [], definitions: [] };
  const bezier = {
    start: { x: 0, y: 100 },
    c1: { x: 0, y: 0 },
    c2: { x: 100, y: 0 },
    end: { x: 100, y: 100 },
  };
  const curve = {
    isEmpty: false,
    firstOnCurvePointIndex: 0,
    pointCount: 4,
    getNextOnCurvePointIndex: (i) => (i === 0 ? 1 : -1),
    getCubicBezier: () => bezier,
    clone() {
      return this;
    },
  };
  class Poly {
    constructor() {
      this.parts = [];
    }
    static create() {
      return new Poly();
    }
    addCurve(c) {
      this.parts.push(c);
    }
    clone() {
      return this;
    }
    transform() {
      return this;
    }
    getExactBoundingBox() {
      return { x: 0, y: 0, width: 100, height: 100 };
    }
    *[Symbol.iterator]() {
      yield curve;
    }
  }
  const node = {
    isPolyCurveNode: true,
    polyCurve: new Poly(),
    localToSpreadTransform: {},
    isSameNode: (other) => other === node,
  };
  const selection = { length: selected ? 1 : 0, nodes: selected ? [node] : [] };
  const doc = {
    selection,
    currentSpread: {},
    executeCommand: (c) => records.writes.push(c),
  };
  const modules = {
    "/document.js": { Document: { current: doc } },
    "/dialog.js": {
      Dialog: {
        create: () => ({
          addColumn: () => ({
            addGroup: () => ({
              addStaticText() {},
              addCheckBox: () => ({ value: true }),
            }),
          }),
          runModal: () => ({ value: cancel ? 2 : 1 }),
        }),
      },
      DialogResult: { Ok: { value: 1 } },
    },
    "/geometry.js": {
      PolyCurve: Poly,
      Curve: {
        createLine: (a, b) => ({ a, b }),
        createRectangle: (rect) => ({ rect }),
        createEllipse: (ellipse) => ({ ellipse }),
      },
    },
    "/nodes.js": {
      PolyCurveNodeDefinition: {
        create: (poly, ...style) => ({ poly, style }),
      },
    },
    "/commands.js": {
      AddChildNodesCommandBuilder: {
        create: () => ({
          setInsertionTarget() {},
          addPolyCurveNode: (def) => records.definitions.push(def),
          createCommand: (select) => ({ select }),
        }),
      },
    },
    "/fills.js": {
      FillDescriptor: {
        createNone: () => ({ none: true }),
        createSolid: (colour) => ({ colour }),
      },
    },
    "/linestyle.js": {
      LineStyleDescriptor: { createDefault: (weight) => ({ weight }) },
    },
    "/colours.js": { RGB8: (r, g, b) => ({ r, g, b }) },
    "affinity:common": { BlendMode: { Normal: 0 } },
  };
  return {
    run: () =>
      vm.runInNewContext(script, {
        require: (name) => {
          assert.ok(modules[name], name);
          return modules[name];
        },
      }),
    records,
    doc,
    selection,
  };
}
test("Affinity add-on creates all construction layers with a single mutation", () => {
  const h = host();
  h.run();
  assert.equal(h.records.writes.length, 1);
  assert.equal(h.records.writes[0].select, false);
  assert.equal(h.doc.selection, h.selection);
  assert.deepEqual(
    h.records.definitions.map((d) => d.userDescription).sort(),
    [
      "Anchor points and handles",
      "Bézier trace",
      "Canvas grid",
      "Curvature comb",
      "Radius circles",
      "Tangent spines",
    ]
      .map((s) => "Logo Grid / " + s)
      .sort(),
  );
  assert.ok(h.records.definitions.every((d) => d.poly.parts.length > 0));
});
test("Affinity Cancel leaves the document unchanged", () => {
  const h = host({ cancel: true });
  h.run();
  assert.equal(h.records.writes.length, 0);
  assert.equal(h.records.definitions.length, 0);
});
test("Affinity empty selection has an actionable error and no mutation", () => {
  const h = host({ selected: false });
  assert.throws(h.run, /select your logo curve layers/);
  assert.equal(h.records.writes.length, 0);
});
