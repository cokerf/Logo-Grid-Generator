import { updateExportRulers } from "./exportRulers.ts";
import { applyCamera, type MotionPreset } from "./motion.ts";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
export interface ExportSettings {
  motion?: MotionPreset;
  width: number;
  height: number;
  duration: number;
  fps: number;
  quality: "standard" | "high";
  includeGuides: boolean;
  includeRulers?: boolean;
  transparent: boolean;
  ending: "hold" | "clean";
}
const ns = "http://www.w3.org/2000/svg";
export function validateDimensions(
  width: number,
  height: number,
  video = false,
) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 16 ||
    height < 16 ||
    width > 8192 ||
    height > 8192 ||
    width * height > 33_554_432
  )
    throw new Error(
      "Use whole pixel dimensions from 16 to 8192, up to 33 megapixels.",
    );
  if (video && (width % 2 || height % 2))
    throw new Error("MP4 width and height must be even numbers.");
}
export function makeExportSVG(
  source: SVGSVGElement,
  settings: ExportSettings,
  background: string,
) {
  validateDimensions(settings.width, settings.height);
  const svg = source.cloneNode(true) as SVGSVGElement;
  svg.setAttribute("xmlns", ns);
  svg.setAttribute("width", String(settings.width));
  svg.setAttribute("height", String(settings.height));
  svg.removeAttribute("class");
  svg.removeAttribute("style");
  if (!settings.includeGuides)
    svg
      .querySelectorAll("#element-guides,#alignment-guides")
      .forEach((n) => n.remove());
  svg.querySelectorAll("[style]").forEach((n) => n.removeAttribute("style"));
  // Keep artwork and camera inside a nested viewport; rulers stay fixed to the output frame.
  const outer = document.createElementNS(ns, "svg");
  outer.setAttribute("xmlns", ns);
  outer.setAttribute("width", String(settings.width));
  outer.setAttribute("height", String(settings.height));
  outer.setAttribute("viewBox", `0 0 ${settings.width} ${settings.height}`);
  if(!settings.transparent){
    const rect=document.createElementNS(ns,"rect");
    rect.setAttribute("width","100%");rect.setAttribute("height","100%");rect.setAttribute("fill",background);
    outer.append(rect);
  }
  outer.append(svg);
  if(settings.includeRulers!==false && source.getAttribute("data-rulers")==="true"){
    const rulers=document.createElementNS(ns,"g");
    rulers.setAttribute("data-export-rulers","true");
    rulers.setAttribute("data-background",source.getAttribute("data-ruler-background")||"#151515");
    rulers.setAttribute("data-ink",source.getAttribute("data-ruler-text")||"#9a96aa");
    outer.append(rulers);updateExportRulers(outer);
  }
  return outer;
}

export function applyConstruction(
  svg: SVGSVGElement,
  progress: number,
  ending: "hold" | "clean" = "hold",
  motion: MotionPreset = "technical",
) {
  applyCamera(svg, motion, progress);
  updateExportRulers(svg);
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const ease = (v: number) => v * v * (3 - 2 * v);
  for (const group of Array.from(
    svg.querySelectorAll<SVGElement>("[data-stage]"),
  )) {
    const stage = Number(group.dataset.stage);
    const nodes = group.matches(
      "path,line,circle,rect,polyline,ellipse,text,[data-live-text]",
    )
      ? [group]
      : Array.from(
          group.querySelectorAll<SVGGeometryElement>(
            "path,line,circle,rect,polyline,ellipse,text,[data-live-text]",
          ),
        );
    group.setAttribute(
      "opacity",
      group.getAttribute("data-base-opacity") ||
        group.getAttribute("opacity") ||
        "1",
    );
    if (!group.hasAttribute("data-base-opacity"))
      group.setAttribute(
        "data-base-opacity",
        group.getAttribute("opacity") || "1",
      );
    nodes.forEach((node, index) => {
      const start =
        stage === 4
          ? motion === "minimal"
            ? 0.12
            : 0.22
          : stage * (motion === "precision" ? 0.1 : 0.13);
      const local = ease(
        clamp(
          (progress - start - (index / Math.max(nodes.length, 1)) * 0.12) /
            0.27,
        ),
      );
      const original =
        node.getAttribute("data-original-opacity") ||
        node.getAttribute("opacity") ||
        "1";
      node.setAttribute("data-original-opacity", original);
      const fade =
        ending === "clean" && !node.hasAttribute("data-logo")
          ? 1 - ease(clamp((progress - 0.82) / 0.14))
          : 1;
      node.setAttribute(
        "opacity",
        String(Number(original) * (local > 0 ? 1 : 0) * fade),
      );
      if (node.hasAttribute("data-logo"))
        node.setAttribute(
          "fill-opacity",
          String(ease(clamp((progress - 0.69) / 0.17))),
        );
      // Filled markers appear; strokes are traced using their actual SVG lengths.
      if ((node as SVGGeometryElement).getTotalLength) {
        try {
          if(!node.hasAttribute('data-length')) {
            node.setAttribute('data-length',String((node as SVGGeometryElement).getTotalLength()));
            node.setAttribute('data-original-dash',node.getAttribute('stroke-dasharray')||'');
            node.setAttribute('data-original-offset',node.getAttribute('stroke-dashoffset')||'');
          }
          const length=Number(node.getAttribute('data-length'));
          if(length>0&&local<1){node.setAttribute('stroke-dasharray',`${length} ${length}`);node.setAttribute('stroke-dashoffset',String(length*(1-local)));}
          else {
            const dash=node.getAttribute('data-original-dash'),offset=node.getAttribute('data-original-offset');
            if(dash)node.setAttribute('stroke-dasharray',dash);else node.removeAttribute('stroke-dasharray');
            if(offset)node.setAttribute('stroke-dashoffset',offset);else node.removeAttribute('stroke-dashoffset');
          }
        } catch {
          /* An empty geometry has nothing to trace. */
        }
      }
    });
  }
}
export const serializeSVG = (svg: SVGSVGElement) =>
  new XMLSerializer().serializeToString(svg);
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
async function raster(svg: SVGSVGElement, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const blob = new Blob([serializeSVG(svg)], { type: "image/svg+xml" }),
    url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not render the SVG frame."));
      img.src = url;
    });
    signal?.throwIfAborted();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function exportPNG(
  source: SVGSVGElement,
  settings: ExportSettings,
  background: string,
) {
  const svg = makeExportSVG(source, settings, background),
    img = await raster(svg),
    canvas = document.createElement("canvas");
  canvas.width = settings.width;
  canvas.height = settings.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("PNG export failed."))),
      "image/png",
    ),
  );
  download(blob, "logo-grid.png");
}
export async function exportMP4(
  source: SVGSVGElement,
  settings: ExportSettings,
  background: string,
  onProgress: (p: number) => void,
  signal: AbortSignal,
) {
  validateDimensions(settings.width, settings.height, true);
  if (!("VideoEncoder" in window) || !("VideoFrame" in window))
    throw new Error(
      "MP4 export needs WebCodecs. Open the web app in a current Chrome or Edge browser over HTTPS or localhost.",
    );
  const { width, height, fps, duration } = settings;
  if (![24, 30, 60].includes(fps) || duration < 3 || duration > 30)
    throw new Error(
      "Choose 24, 30, or 60 fps and a duration from 3 to 30 seconds.",
    );
  const bitrate = Math.round(
    Math.min(
      100_000_000,
      Math.max(
        4_000_000,
        width * height * fps * (settings.quality === "high" ? 0.22 : 0.12),
      ),
    ),
  );
  let config: VideoEncoderConfig | undefined;
  for (const codec of [
    "avc1.640034",
    "avc1.640033",
    "avc1.420034",
    "avc1.42001f",
  ]) {
    const candidate: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate,
      framerate: fps,
      avc: { format: "avc" },
      latencyMode: "quality",
    };
    if ((await VideoEncoder.isConfigSupported(candidate)).supported) {
      config = candidate;
      break;
    }
  }
  if (!config)
    throw new Error(
      "This device cannot encode H.264 at these dimensions. Try a smaller size or 30 fps.",
    );
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "avc", width, height },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });
  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => {
      encoderError = error;
    },
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas is unavailable.");
  const base = makeExportSVG(
      source,
      { ...settings, transparent: false },
      background,
    ),
    total = Math.round(duration * fps);
  try {
    encoder.configure(config);
    for (let frame = 0; frame < total; frame++) {
      signal.throwIfAborted();
      if (encoderError) throw encoderError;
      const svg = base.cloneNode(true) as SVGSVGElement;
      applyConstruction(
        svg,
        frame / Math.max(1, total - 1),
        settings.ending,
        settings.motion,
      );
      const img = await raster(svg, signal);
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round((frame * 1_000_000) / fps),
        duration: Math.round(1_000_000 / fps),
      });
      try {
        encoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
      } finally {
        videoFrame.close();
      }
      if (encoder.encodeQueueSize > 6) await encoder.flush();
      onProgress(((frame + 1) / total) * 0.97);
      if (frame % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    await encoder.flush();
    signal.throwIfAborted();
    if (encoderError) throw encoderError;
    muxer.finalize();
    onProgress(1);
    return new Blob([target.buffer], { type: "video/mp4" });
  } finally {
    if (encoder.state !== "closed") encoder.close();
    canvas.width = canvas.height = 0;
  }
}
