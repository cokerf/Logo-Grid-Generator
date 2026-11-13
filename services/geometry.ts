import paper from "paper";
import {extendLine,type Bounds} from "./drafting.ts";
const scope = new paper.PaperScope();
let ready = false;
export type Analysis = {
  comb: string;
  envelope: string;
  spines: string[];
  circles: { x: number; y: number; r: number }[];
};
export function analyzePath(
  d: string,
  scale: number,
  samples: number,
  gain: number,
  viewport?: Bounds,
): Analysis {
  if (!ready) {
    scope.setup(new scope.Size(1, 1));
    ready = true;
  }
  scope.activate();
  const item = new scope.CompoundPath({ pathData: d, insert: false });
  const result: Analysis = { comb: "", envelope: "", spines: [], circles: [] };
  for (const child of item.children as paper.Path[]) {
    let envelope = "";
    const count = Math.max(
      8,
      Math.round((samples * child.length) / Math.max(scale, 1)),
    );
    for (let i = 0; i <= Math.min(count, 400); i++) {
      const offset = (child.length * i) / Math.min(count, 400);
      const p = child.getPointAt(offset),
        n = child.getNormalAt(offset),
        t = child.getTangentAt(offset),
        k = child.getCurvatureAt(offset);
      if (!p || !n || !t || !Number.isFinite(k)) continue;
      const length = Math.max(
        -scale * 0.2,
        Math.min(scale * 0.2, k * scale * scale * 0.015 * gain),
      );
      const end = p.add(n.multiply(length));
      if (Math.abs(k) > 1e-7) {
        result.comb += `M${p.x} ${p.y}L${end.x} ${end.y}`;
        envelope += `${envelope ? "L" : "M"}${end.x} ${end.y}`;
      }
      if (i % Math.max(1, Math.round(count / 8)) === 0) {
        const frame=viewport?{x:viewport.x-viewport.width,y:viewport.y-viewport.height,width:viewport.width*3,height:viewport.height*3}:{x:-scale*8,y:-scale*8,width:scale*16,height:scale*16};
        const extended=extendLine(p,t,frame);
        if(extended)result.spines.push(`M${extended.a.x} ${extended.a.y}L${extended.b.x} ${extended.b.y}`);
        const r = 1 / k;
        if (
          Number.isFinite(r) &&
          Math.abs(r) < scale * 1.5 &&
          Math.abs(r) > scale * 0.015
        ) {
          // Paper normals point right of the tangent; signed curvature points left.
          const c = p.subtract(n.multiply(r));
          result.circles.push({ x: c.x, y: c.y, r: Math.abs(r) });
        }
      }
    }
    result.envelope += envelope;
  }
  item.remove();
  return result;
}
