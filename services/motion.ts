export type MotionPreset = "technical" | "precision" | "tour" | "minimal";
export const motionPresets = [
  {
    id: "technical",
    name: "Technical build",
    description: "Grid, geometry and a complete logo reveal.",
    duration: 8,
  },
  {
    id: "precision",
    name: "Precision close-up",
    description: "A close-up pan, traced details and a smooth pullback.",
    duration: 10,
  },
  {
    id: "tour",
    name: "Geometry tour",
    description: "Move through curve details, then settle on the full mark.",
    duration: 12,
  },
  {
    id: "minimal",
    name: "Quiet reveal",
    description: "Restrained drawing, a subtle zoom and a clean finish.",
    duration: 8,
  },
] as const;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * smooth(t);
export function cameraAt(preset: MotionPreset, progress: number) {
  const t = clamp(progress);
  if (t >= 0.85) return { zoom: 1, x: 0, y: 0 };
  if (preset === "precision") {
    const settle = smooth((t - 0.44) / 0.37),
      pan = smooth(t / 0.58);
    return {
      zoom: mix(1.85, 1, settle),
      x: (-0.16 + 0.3 * pan) * (1 - settle),
      y: (-0.12 + 0.19 * pan) * (1 - settle),
    };
  }
  if (preset === "tour") {
    const settle = smooth((t - 0.55) / 0.29),
      pan = smooth((t - 0.08) / 0.52);
    return {
      zoom: mix(1.48, 1, settle),
      x: mix(-0.13, 0.14, pan) * (1 - settle),
      y: (-0.065 + Math.sin(pan * Math.PI) * 0.1) * (1 - settle),
    };
  }
  if (preset === "minimal") return { zoom: mix(1.08, 1, t / 0.8), x: 0, y: 0 };
  return { zoom: 1, x: 0, y: 0 };
}
export function applyCamera(
  svg: SVGSVGElement,
  preset: MotionPreset,
  progress: number,
) {
  const scene = svg.querySelector<SVGSVGElement>("svg") || svg;
  const [x, y, w, h] = (scene.getAttribute("viewBox") || "0 0 100 100")
    .split(/[\s,]+/)
    .map(Number);
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return;
  const c = cameraAt(preset, progress),
    nw = w / c.zoom,
    nh = h / c.zoom;
  scene.setAttribute(
    "viewBox",
    `${x + (w - nw) / 2 + c.x * w} ${y + (h - nh) / 2 + c.y * h} ${nw} ${nh}`,
  );
}
