import svgpath from "svgpath";
import type { Point, Handle, ParsedSVG, PathSegment } from "../types";
export const segmentsToD = (segments: PathSegment[]) =>
  segments.map((s) => s.command + s.values.join(" ")).join("");

export function parsePathD(d: string) {
  const normalized = svgpath(d).abs().unshort().unarc();
  const error = (normalized as typeof normalized & { err?: string }).err;
  if (error) throw new Error(error);
  const points: Point[] = [],
    handles: Handle[] = [],
    segments: PathSegment[] = [];
  let p = { x: 0, y: 0 },
    start = { ...p };
  normalized.iterate((s: any[]) => {
    let command = s[0],
      values = s.slice(1) as number[];
    if (command === "H") {
      command = "L";
      values = [values[0], p.y];
    }
    if (command === "V") {
      command = "L";
      values = [p.x, values[0]];
    }
    const index = segments.length;
    const end = values.length
      ? { x: values[values.length - 2], y: values[values.length - 1] }
      : { ...start };
    if (command === "C" || command === "Q") {
      handles.push({
        start: { ...p },
        end: { x: values[0], y: values[1] },
        segmentIndex: index,
        valueIndex: 0,
      });
      const offset = command === "C" ? 2 : 0;
      handles.push({
        start: { ...end },
        end: { x: values[offset], y: values[offset + 1] },
        segmentIndex: index,
        valueIndex: offset,
      });
    }
    if (command === "M") start = { ...end };
    if (command !== "Z") points.push(end);
    p = end;
    segments.push({ command, values });
  });
  return { points, handles, segments };
}

export function parseSVG(source: string): ParsedSVG {
  if (source.length > 5_000_000)
    throw new Error("Please use an SVG smaller than 5 MB.");
  const doc = new DOMParser().parseFromString(source, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg || doc.querySelector("parsererror"))
    throw new Error("This file is not valid SVG.");
  if (
    svg.querySelector("text,use,image,foreignObject") ||
    svg.querySelector("[clip-path],[mask]")
  )
    throw new Error(
      "Expand text and SVG instances to paths, and flatten clipping masks before importing.",
    );
  // Whitelist geometry only. Never attach scripts, external resources, or event attributes.
  const ns = "http://www.w3.org/2000/svg";
  const host = document.createElementNS(ns, "svg");
  host.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none";
  const copy = (input: Element, parent: Element) => {
    if (
      ["defs", "clippath", "mask", "pattern", "symbol"].includes(
        input.localName.toLowerCase(),
      )
    )
      return;
    const allowed = [
      "svg",
      "g",
      "path",
      "rect",
      "circle",
      "ellipse",
      "line",
      "polyline",
      "polygon",
    ];
    if (!allowed.includes(input.localName)) return;
    const el = document.createElementNS(
      ns,
      input.localName === "svg" ? "g" : input.localName,
    );
    for (const name of [
      "d",
      "x",
      "y",
      "width",
      "height",
      "rx",
      "ry",
      "cx",
      "cy",
      "r",
      "x1",
      "x2",
      "y1",
      "y2",
      "points",
      "transform",
      "fill-rule",
    ]) {
      const value = input.getAttribute(name);
      if (value) el.setAttribute(name, value);
    }
    parent.appendChild(el);
    for (const child of Array.from(input.children)) copy(child, el);
  };
  copy(svg, host);
  document.body.appendChild(host);
  try {
    const shapes = Array.from(
      host.querySelectorAll("path,rect,circle,ellipse,line,polyline,polygon"),
    ) as SVGGraphicsElement[];
    const paths = shapes
      .map((el) => {
        const a = (key: string, fallback = 0) =>
          Number(el.getAttribute(key) || fallback);
        let d = el.getAttribute("d") || "";
        if (el.localName === "rect") {
          const x = a("x"),
            y = a("y"),
            w = a("width"),
            h = a("height"),
            rx = Math.min(a("rx", a("ry")), w / 2),
            ry = Math.min(a("ry", rx), h / 2);
          d =
            rx && ry
              ? `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`
              : `M${x} ${y}h${w}v${h}h${-w}Z`;
        } else if (["circle", "ellipse"].includes(el.localName)) {
          const x = a("cx"),
            y = a("cy"),
            rx = a("r", a("rx")),
            ry = a("r", a("ry"));
          d = `M${x - rx} ${y}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
        } else if (el.localName === "line")
          d = `M${a("x1")} ${a("y1")}L${a("x2")} ${a("y2")}`;
        else if (["polygon", "polyline"].includes(el.localName))
          d = `M${el.getAttribute("points") || ""}${el.localName === "polygon" ? "Z" : ""}`;
        const m = el.getCTM();
        const transformed = svgpath(d).abs().unshort().unarc();
        if (m) transformed.matrix([m.a, m.b, m.c, m.d, m.e, m.f]);
        const data = parsePathD(transformed.toString());
        const canonical = segmentsToD(data.segments);
        const p = document.createElementNS(ns, "path");
        p.setAttribute("d", canonical);
        host.appendChild(p);
        const b = p.getBBox();
        p.remove();
        return {
          d: canonical,
          ...data,
          fillRule: (el.getAttribute("fill-rule") ||
            el.closest("[fill-rule]")?.getAttribute("fill-rule") ||
            "nonzero") as "nonzero" | "evenodd",
          boundingBox: {
            x: b.x,
            y: b.y,
            width: b.width,
            height: b.height,
          } as SVGRect,
        };
      })
      .filter((p) => p.segments.length);
    if (!paths.length)
      throw new Error(
        "No vector geometry found. Convert text to outlines and expand SVG instances first.",
      );
    const boxes = paths.map((p) => p.boundingBox);
    const x = Math.min(...boxes.map((b) => b.x)),
      y = Math.min(...boxes.map((b) => b.y));
    const w = Math.max(...boxes.map((b) => b.x + b.width)) - x,
      h = Math.max(...boxes.map((b) => b.y + b.height)) - y;
    const pad = Math.max(w, h, 1) * 0.18,
      width = Math.max(w, 1) + pad * 2,
      height = Math.max(h, 1) + pad * 2;
    return {
      rawSVG: source,
      viewBox: `${x - pad} ${y - pad} ${width} ${height}`,
      width,
      height,
      paths,
    };
  } finally {
    host.remove();
  }
}
