export function canvasViewport(source: string, aspect: number) {
  const [x, y, w, h] = source
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const width = Math.max(w, h * aspect),
    height = Math.max(h, w / aspect);
  return { x: x - (width - w) / 2, y: y - (height - h) / 2, width, height };
}
