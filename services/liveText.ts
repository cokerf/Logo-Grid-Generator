const ns = "http://www.w3.org/2000/svg";
const typography = [
  "fill",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-stretch",
  "font-variant",
  "letter-spacing",
  "word-spacing",
  "text-anchor",
  "dominant-baseline",
  "alignment-baseline",
  "baseline-shift",
  "writing-mode",
  "direction",
  "unicode-bidi",
  "white-space",
  "text-transform",
];
const geometry = [
  "d",
  "x",
  "y",
  "dx",
  "dy",
  "rotate",
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
  "startOffset",
  "textLength",
  "lengthAdjust",
  "method",
  "spacing",
  "side",
  "path",
];
export function sanitizeGeometry(svg: Element, fontOverride?: string) {
  const host = document.createElementNS(ns, "svg");
  host.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;font-size:16px;font-family:Arial,sans-serif";
  const prefix = `lg-${crypto.randomUUID()}-`;
  const ids = new Map(
    Array.from(svg.querySelectorAll("[id]")).map((el) => [
      el.id,
      prefix + el.id,
    ]),
  );
  const rules: CSSStyleRule[] = [];
  for (const style of Array.from(svg.querySelectorAll("style"))) {
    const sheet = new CSSStyleSheet();
    try {
      sheet.replaceSync(style.textContent || "");
      for (const rule of Array.from(sheet.cssRules))
        if (rule instanceof CSSStyleRule) rules.push(rule);
    } catch {
      /* Ignore malformed or unsupported CSS, never attach it. */
    }
  }
  const copy = (input: Element, parent: Element) => {
    const tag = input.localName;
    if (
      ![
        "svg",
        "g",
        "defs",
        "path",
        "rect",
        "circle",
        "ellipse",
        "line",
        "polyline",
        "polygon",
        "text",
        "tspan",
        "textPath",
      ].includes(tag)
    )
      return;
    const el = document.createElementNS(ns, tag === "svg" ? "g" : tag);
    for (const name of geometry) {
      const value = input.getAttribute(name);
      if (value && !/url\s*\(/i.test(value)) el.setAttribute(name, value);
    }
    const fill = input.getAttribute("fill");
    if (fill && (fill === "none" || CSS.supports("color", fill)))
      el.setAttribute("fill", fill);
    if (input.id) el.id = ids.get(input.id) || "";
    const style = document.createElement("span").style;
    // Resolve internal typography classes into attributes; no CSS or external resources are injected.
    for (const name of typography) {
      const value = input.getAttribute(name);
      if (value) style.setProperty(name, value);
    }
    for (const rule of rules) {
      try {
        if (input.matches(rule.selectorText))
          for (const name of typography) {
            const value = rule.style.getPropertyValue(name);
            if (value) style.setProperty(name, value);
          }
      } catch {
        /* Invalid selector. */
      }
    }
    const inline = document.createElement("span").style;
    inline.cssText = input.getAttribute("style") || "";
    for (const name of typography) {
      const value = inline.getPropertyValue(name);
      if (value) style.setProperty(name, value);
    }
    for (const name of typography) {
      const value = style.getPropertyValue(name);
      if (value && !/[<>]|url\s*\(/i.test(value)) el.setAttribute(name, value);
    }
    if (fontOverride && ["text", "tspan", "textPath"].includes(tag))
      el.setAttribute("font-family", fontOverride);
    if (tag === "textPath") {
      const href =
        input.getAttribute("href") ||
        input.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (href) {
        if (!href.startsWith("#") || !ids.has(href.slice(1)))
          throw new Error(
            "The SVG text path must reference a path included in the same SVG.",
          );
        el.setAttribute("href", "#" + ids.get(href.slice(1)));
      }
    }
    parent.appendChild(el);
    for (const child of Array.from(input.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) copy(child as Element, el);
      else if (
        child.nodeType === Node.TEXT_NODE &&
        ["text", "tspan", "textPath"].includes(tag)
      )
        el.appendChild(document.createTextNode(child.textContent || ""));
    }
  };
  copy(svg, host);
  return host;
}
export function collectLiveText(host: SVGSVGElement) {
  const texts = Array.from(host.querySelectorAll("text"))
    .filter((el) => !el.closest("defs"))
    .map((el) => {
      const clone = el.cloneNode(true) as SVGTextElement;
      // Make inherited typography explicit so export does not depend on the surrounding document.
      const style = getComputedStyle(el);
      for (const name of typography) {
        const value = style.getPropertyValue(name);
        if (value) clone.setAttribute(name, value);
      }
      const matrix = el.getCTM();
      if (matrix)
        clone.setAttribute(
          "transform",
          `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`,
        );
      const b = el.getBBox();
      const corners = [
        [b.x, b.y],
        [b.x + b.width, b.y],
        [b.x, b.y + b.height],
        [b.x + b.width, b.y + b.height],
      ].map(([x, y]) =>
        new DOMPoint(x, y).matrixTransform(matrix || new DOMMatrix()),
      );
      const x = Math.min(...corners.map((p) => p.x)),
        y = Math.min(...corners.map((p) => p.y));
      return {
        markup: new XMLSerializer().serializeToString(clone),
        boundingBox: {
          x,
          y,
          width: Math.max(...corners.map((p) => p.x)) - x,
          height: Math.max(...corners.map((p) => p.y)) - y,
        } as SVGRect,
      };
    });
  // Include only definitions actually referenced by text, including visible guide paths.
  const defs = document.createElementNS(ns, "defs");
  const references = new Set(
    Array.from(host.querySelectorAll("textPath[href]")).map((el) =>
      el.getAttribute("href")!.slice(1),
    ),
  );
  for (const id of references) {
    const source = Array.from(host.querySelectorAll("[id]")).find(
      (el) => el.id === id,
    );
    if (source) defs.appendChild(source.cloneNode(true));
  }
  return { texts, definitions: defs.innerHTML };
}
