import { styleVariation } from "./services/styleVariation";
import { motionPresets } from "./services/motion";
import { LogoLibrary } from "./components/LogoLibrary";
import { PlaybackButton } from "./components/PlaybackButton";
import exampleLogo from "./assets/coker-example.svg?raw";
import {
  bundledFontCSS,
  importFont,
  type UploadedFont,
} from "./services/fonts";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { ControlPanel, type Visibility } from "./components/ControlPanel";
import { Canvas } from "./components/Canvas";
import type { AnalysisOptions } from "./components/AnalysisLayers";
import type { ParsedSVG, CustomizationOptions, Point, Guide } from "./types";
import { parseSVG, parsePathD, segmentsToD } from "./services/svgParser";
import { useHistoryState } from "./hooks/useHistoryState";
import {
  applyConstruction,
  makeExportSVG,
  serializeSVG,
  download,
  exportPNG,
  exportMP4,
  type ExportSettings,
} from "./services/exporter";
const demo = exampleLogo;
const initial: CustomizationOptions = {
  showFill: false,
  useOriginalColors: false,
  fillColor: "#e2defa24",
  path: { stroke: "#e2defa", strokeWidth: 0.8 },
  anchors: { color: "#a799ff", size: 3, shape: "square" },
  handles: { color: "#a799ff", width: 0.7 },
  outlines: { color: "#6a8060", width: 0.7, style: "dashed" },
  gridlines: {
    color: "#c6c2dd24",
    width: 0.5,
    style: "lines",
    type: "square",
    density: 20,
    columns: 10,
    rows: 10,
  },
  elementGuides: { color: "#a05c4680", width: 0.5, style: "dashed" },
  alignmentGuides: { color: "#a05c4680", width: 0.5, style: "dashed" },
  rulers: { background: "#151515", text: "#9a96aa" },
  guides: { color: "#d28054" },
  canvasBackground: "#101010",
};
const isPlugin = window.parent !== window;
function Preview({
  source,
  settings,
  background,
  progress,
  revision,
}: {
  source: React.RefObject<SVGSVGElement | null>;
  settings: ExportSettings;
  background: string;
  progress: number;
  revision: unknown;
}) {
  const host=useRef<HTMLDivElement>(null),scene=useRef<SVGSVGElement|null>(null);
  useEffect(()=>{
    if(!source.current||!host.current)return;
    const svg=makeExportSVG(source.current,{...settings,transparent:false},background);
    svg.style.width='100%';svg.style.height='100%';
    host.current.replaceChildren(svg);scene.current=svg;
    return()=>{svg.remove();if(scene.current===svg)scene.current=null;};
  },[source,settings,background,revision]);
  useEffect(()=>{
    if(scene.current)applyConstruction(scene.current,progress,settings.ending,settings.motion);
  },[progress,settings,background,revision]);
  return <div ref={host} role="img" aria-label="Construction animation preview" style={{position:'absolute',inset:0,width:'100%',height:'100%',background,pointerEvents:'none'}}/>;

}
export default function App() {
  const {
    state: data,
    setState: setData,
    resetState: reset,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<ParsedSVG | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("logo-grid-theme-v3") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("logo-grid-theme-v3", theme);
    } catch {}
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const [font, setFont] = useState<UploadedFont | null>(null);
  const fontRef = useRef<UploadedFont | null>(null),
    fontInput = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState<ParsedSVG | null>(null),
    [visibility, setVisibility] = useState<Visibility>({
      anchors: false,
      handles: false,
      outlines: false,
      grid: true,
      elementGuides: false,
      alignment: false,
      rulers: true,
      snap: false,
    });
  const [analysis, setAnalysis] = useState<AnalysisOptions>({
    curves: true,
    dimensions: false,
    spines: false,
    circles: false,
    samples: 36,
    gain: 1,
    color: "#a799ff",
  });
  const [customization, setCustomization] = useState(initial),
    [settings, setSettings] = useState<ExportSettings>({
      motion: "technical",
      width: 1080,
      height: 1350,
      duration: 8,
      fps: 30,
      quality: "high",
      includeGuides: true,
      includeRulers: true,
      transparent: false,
      ending: "hold",
    });
  const [error, setError] = useState(""),
    [fileName, setFileName] = useState("Example / coker-logo.svg"),
    [guides, setGuides] = useState<Guide[]>([]),
    [selected, setSelected] = useState<number | null>(null),
    [dragOver, setDragOver] = useState(false),
    [panel, setPanel] = useState(false);
  const [mode, setMode] = useState<"inspect" | "construct">("inspect"),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [exportProgress, setExportProgress] = useState<number | null>(null),
    [notice, setNotice] = useState("");
  const svgRef = useRef<SVGSVGElement>(null),
    fileRef = useRef<HTMLInputElement>(null),
    abortRef = useRef<AbortController | null>(null),
    sourceNode = useRef<string | null>(null);
  const displayed = live || data;
  const stageRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState({ width: 600, height: 750 });
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const style = getComputedStyle(el),
        w =
          el.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
        h =
          el.clientHeight -
          parseFloat(style.paddingTop) -
          parseFloat(style.paddingBottom),
        ratio = Math.max(settings.width, 1) / Math.max(settings.height, 1);
      setBoard({
        width: Math.max(1, Math.min(w, h * ratio)),
        height: Math.max(1, Math.min(h, w / ratio)),
      });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    fit();
    return () => observer.disconnect();
  }, [settings.width, settings.height]);
  const loadSVG = useCallback(
    async (source: string, name: string) => {
      try {
        if (/<text[\s>]/i.test(source)) {
          await Promise.all(
            [400, 600, 700].map((weight) =>
              document.fonts.load(`${weight} 24px Archivo`),
            ),
          );
          await document.fonts.ready;
        }
        const parsed = parseSVG(source, fontRef.current?.family);
        reset(parsed);
        setLive(null);
        setSelected(null);
        setGuides([]);
        setFileName(name);
        setNotice("");
        setError("");
        setTime(0);
        setPlaying(false);
        setMode("inspect");
        return true;
      } catch (e) {
        setError((e as Error).message);
        return false;
      }
    },
    [reset],
  );
  useEffect(() => {
    loadSVG(demo, "Example / coker-logo.svg");
  }, [loadSVG]);
  useEffect(() => {
    if (!isPlugin) return;
    const listener = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const msg = event.data.pluginMessage;
      if (!msg) return;
      if (msg.type === "selection") {
        sourceNode.current = msg.nodeId;
        loadSVG(msg.svgContent, msg.name || "Figma selection");
      }
      if (msg.type === "deselection") {
        sourceNode.current = null;
        setNotice("Select a vector, group, component, or frame in Figma.");
      }
      if (msg.type === "inserted")
        setNotice("Editable construction inserted in Figma.");
      if (msg.type === "error") setError(msg.message);
    };
    window.addEventListener("message", listener);
    window.parent.postMessage({ pluginMessage: { type: "ready" } }, "*");
    return () => window.removeEventListener("message", listener);
  }, [loadSVG]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches(
          'input,select,textarea,[contenteditable="true"]',
        )
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
      if (e.code === "Space") {
        e.preventDefault();
        setMode("construct");
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);
  useEffect(() => {
    if (!playing) return;
    let id = 0,
      last = 0;
    const tick = (now: number) => {
      if(last && now-last<1000/30){id=requestAnimationFrame(tick);return;}

      if (last) {
        const delta = (now - last) / 1000 / settings.duration;
        setTime((t) => {
          if (t + delta >= 1) {
            setPlaying(false);
            return 1;
          }
          return t + delta;
        });
      }
      last = now;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, settings.duration]);
  const upload = async (file: File) => {
    setDragOver(false);
    try {
      if (file.size > 5_000_000)
        throw new Error("Please use an SVG smaller than 5 MB.");
      loadSVG(await file.text(), file.name);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const updatePath = (
    pathIndex: number,
    change: (segments: ParsedSVG["paths"][number]["segments"]) => void,
  ) =>
    setLive((current) => {
      if (!current) return current;
      const paths = [...current.paths],
        path = paths[pathIndex],
        segments = structuredClone(path.segments);
      change(segments);
      const d = segmentsToD(segments),
        parsed = parsePathD(d),
        el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("d", d);
      let boundingBox = path.boundingBox;
      if (svgRef.current) {
        svgRef.current.append(el);
        const b = el.getBBox();
        boundingBox = {
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
        } as SVGRect;
        el.remove();
      }
      paths[pathIndex] = { ...path, d, ...parsed, boundingBox };
      return { ...current, paths };
    });
  const moveHandle = (pi: number, hi: number, p: Point) => {
    const handle = displayed?.paths[pi]?.handles[hi];
    if (handle)
      updatePath(pi, (segments) => {
        segments[handle.segmentIndex].values[handle.valueIndex] = p.x;
        segments[handle.segmentIndex].values[handle.valueIndex + 1] = p.y;
      });
  };
  const movePath = (pi: number, delta: Point) =>
    updatePath(pi, (segments) =>
      segments.forEach(
        (s) =>
          (s.values = s.values.map((v, i) => v + (i % 2 ? delta.y : delta.x))),
      ),
    );
  const onExport = async (format: "svg" | "png" | "mp4") => {
    if (!svgRef.current) return;
    setError("");
    try {
      if (format === "svg")
        download(
          new Blob(
            [
              serializeSVG(
                makeExportSVG(
                  svgRef.current,
                  settings,
                  customization.canvasBackground,
                ),
              ),
            ],
            { type: "image/svg+xml" },
          ),
          "logo-grid.svg",
        );
      else if (format === "png")
        await exportPNG(
          svgRef.current,
          settings,
          customization.canvasBackground,
        );
      else {
        abortRef.current = new AbortController();
        setExportProgress(0);
        setPlaying(false);
        download(
          await exportMP4(
            svgRef.current,
            settings,
            customization.canvasBackground,
            setExportProgress,
            abortRef.current.signal,
          ),
          "logo-construction.mp4",
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setExportProgress(null);
      abortRef.current = null;
    }
  };
  const insert = () => {
    if (svgRef.current) {
      try {
        const svg = makeExportSVG(
          svgRef.current,
          settings,
          customization.canvasBackground,
        );
        window.parent.postMessage(
          {
            pluginMessage: {
              type: "insert-construction",
              svg: serializeSVG(svg),
              sourceNodeId: sourceNode.current,
            },
          },
          "*",
        );
      } catch (e) {
        setError((e as Error).message);
      }
    }
  };
  const shuffleStyle=(logo:ParsedSVG|null=displayed)=>{
    if(!logo)return;
    const variation=styleVariation(customization,analysis,visibility,Math.max(logo.width,logo.height),logo.paths.reduce((n,p)=>n+p.points.length,0));
    setCustomization(variation.customization);setAnalysis(variation.analysis);setVisibility(variation.visibility);
    const preset=motionPresets[Math.floor(Math.random()*motionPresets.length)];
    setSettings(current=>({...current,motion:preset.id,duration:preset.duration,ending:preset.id==='minimal'?'clean':'hold'}));
    setTime(0);setPlaying(false);setMode("inspect");setNotice(`${variation.name} · ${preset.name}`);
  };
  const previewRevision = React.useMemo(
    () => ({ displayed, analysis, customization, visibility, font }),
    [displayed, analysis, customization, visibility, font],
  );
  return (
    <div className={`studio ${isPlugin ? "plugin" : ""}`} data-theme={theme}>
      <header className="topbar">
        <svg
          className="appmark"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 1V31M16 1V31M27 1V31M1 5H31M1 16H31M1 27H31"
            stroke="currentColor"
            opacity=".3"
          />
          <circle cx="16" cy="16" r="11" stroke="currentColor" />
          <path d="M5 16C5 1 27 31 27 16" stroke="currentColor" />
          <rect x="3" y="14" width="4" height="4" fill="currentColor" />
          <rect x="25" y="14" width="4" height="4" fill="currentColor" />
        </svg>
        <h1 className="brand">Logo Grid Generator</h1>
        <span className="version">Construction studio</span>
        <button
          className="theme-toggle"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
        <a
          className="credit"
          href="https://cokeroluwafemi.com/"
          target="_blank"
          rel="noreferrer"
        >
          Designed & developed by Coker Oluwafemi
        </a>
      </header>
      <input
        ref={fileRef}
        type="file"
        accept=".svg,image/svg+xml"
        aria-label="Upload SVG file"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
      <input
        ref={fontInput}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        hidden
        aria-label="Upload font file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const value = await importFont(file);
            fontRef.current = value;
            setFont(value);
            if (data) await loadSVG(data.rawSVG, fileName);
          } catch (error) {
            setError((error as Error).message);
          }
        }}
      />
      <div className="workspace">
        <ControlPanel
          onFontUpload={() => fontInput.current?.click()}
          fontName={font?.name || ""}
          onClearFont={() => {
            fontRef.current = null;
            setFont(null);
            if (data) void loadSVG(data.rawSVG, fileName);
          }}
          textCount={displayed?.texts?.length || 0}
          onTextDemo={() =>
            loadSVG(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><defs><path id="lettering" d="M70 280 C70 65 430 65 430 280"/></defs><text fill="#e2defa" font-family="Archivo" font-weight="600" font-size="48" text-anchor="middle"><textPath href="#lettering" startOffset="50%">MAKE ROOM</textPath></text><text fill="#e2defa" x="250" y="315" font-family="Archivo" font-size="72" font-weight="700" text-anchor="middle">for type.</text></svg>`,
              "Example / live-text.svg",
            )
          }
          logoScale={Math.max(displayed?.width||1000,displayed?.height||1000)}
          onInspect={()=>{setMode("inspect");setPlaying(false);}}
          logoLibrary={<LogoLibrary currentName={fileName} onStyle={() => shuffleStyle()} onShuffleLoad={async (svg,name) => { const success=await loadSVG(svg,name); if(success)shuffleStyle(parseSVG(svg,fontRef.current?.family)); return success; }} onLoad={loadSVG} onFallback={(message) => { void loadSVG(demo, "Example / coker-logo.svg"); setNotice(message); }} />}
          open={panel}
          visibility={visibility}
          setVisibility={setVisibility}
          analysis={analysis}
          setAnalysis={setAnalysis}
          customization={customization}
          setCustomization={setCustomization}
          settings={settings}
          setSettings={setSettings}
          onUpload={() => fileRef.current?.click()}
          onDemo={() => loadSVG(demo, "Example / coker-logo.svg")}
          onExport={onExport}
          hasSVG={!!displayed}
          fileName={fileName}
          pathCount={displayed?.paths.length || 0}
          plugin={isPlugin}
          onInsert={insert}
          onPreviewMotion={() => {
            setMode("construct");
            setTime(0);
            setPlaying(true);
          }}
        />
        <main className="stage">
          <div className="stage-toolbar">
            <div className="preview-modes">
              <button
                className="mobile-panel"
                aria-expanded={panel}
                onClick={() => setPanel(!panel)}
              >
                ☰ Settings
              </button>
              <button
                onClick={() => {
                  setMode("inspect");
                  setPlaying(false);
                }}
                className={mode === "inspect" ? "selected-mode" : ""}
              >
                Inspect
              </button>
              <button
                onClick={() => {
                  setMode("construct");
                  setTime(0);
                }}
                className={mode === "construct" ? "selected-mode" : ""}
              >
                Construction
              </button>
            </div>
            <div>
              {mode === "construct" ? (
                <>
                  <PlaybackButton playing={playing} progress={time} onClick={() => { if(time>=1)setTime(0); setPlaying(!playing); }} />
                  <span className="timecode">{(time*settings.duration).toFixed(1)}<span> / {settings.duration}s</span></span>
                  <input
                    className="timeline"
                    aria-label="Construction progress"
                    type="range"
                    min="0"
                    max="1"
                    step=".005"
                    value={time}
                    onChange={(e) => {
                      setPlaying(false);
                      setTime(Number(e.target.value));
                    }}
                  />
                </>
              ) : (
                <>
                  <button aria-label="Undo" disabled={!canUndo} onClick={undo}>
                    ↶
                  </button>
                  <button aria-label="Redo" disabled={!canRedo} onClick={redo}>
                    ↷
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="aspect-presets" aria-label="Canvas proportions">
            {[
              [1080, 1080, "1:1"],
              [1080, 1350, "4:5"],
              [1080, 1920, "9:16"],
              [1920, 1080, "16:9"],
            ].map(([w, h, label]) => (
              <button
                key={label}
                aria-label={`Canvas ${label}`}
                aria-pressed={
                  settings.width / settings.height === Number(w) / Number(h)
                }
                onClick={() =>
                  setSettings({
                    ...settings,
                    width: Number(w),
                    height: Number(h),
                  })
                }
              >
                <span style={{ aspectRatio: `${w}/${h}` }} />
                {label}
              </button>
            ))}
          </div>
          <div className="artboard-wrap" ref={stageRef}>
            <div
              className="artboard"
              style={{ width: board.width, height: board.height }}
            >
              <div
                style={{
                  height: "100%",
                  visibility: mode === "construct" ? "hidden" : "visible",
                }}
              >
                <Canvas
                  svgData={displayed}
                  canvasAspect={
                    Math.max(settings.width, 1) / Math.max(settings.height, 1)
                  }
                  fontCSS={bundledFontCSS + (font?.css || "")}
                  svgRef={svgRef}
                  analysis={analysis}
                  showAnchors={visibility.anchors}
                  showHandles={visibility.handles}
                  showOutlines={visibility.outlines}
                  showGridlines={visibility.grid}
                  showElementGuides={visibility.elementGuides}
                  showAlignmentGuides={visibility.alignment}
                  showRulers={visibility.rulers}
                  guides={guides}
                  onAddGuide={(orientation, position, id) =>
                    setGuides((g) => [
                      ...g,
                      { id: id || crypto.randomUUID(), orientation, position },
                    ])
                  }
                  onUpdateGuide={(id, position) =>
                    setGuides((g) =>
                      g.map((v) => (v.id === id ? { ...v, position } : v)),
                    )
                  }
                  onRemoveGuide={(id) =>
                    setGuides((g) => g.filter((v) => v.id !== id))
                  }
                  error={null}
                  customization={customization}
                  onHandleMove={moveHandle}
                  onPathMove={movePath}
                  snapToGrid={visibility.snap}
                  selectedPathIndex={selected}
                  setSelectedPathIndex={setSelected}
                  onDragStart={() => {
                    if (data) setLive(structuredClone(data));
                  }}
                  onDragEnd={() => {
                    if (live) setData(live);
                    setLive(null);
                  }}
                  onFileUpload={upload}
                  onUploadClick={() => fileRef.current?.click()}
                  isDraggingOver={dragOver}
                  setIsDraggingOver={setDragOver}
                />
              </div>
              {mode === "construct" && (
                <Preview
                  source={svgRef}
                  settings={settings}
                  background={customization.canvasBackground}
                  progress={time}
                  revision={previewRevision}
                />
              )}
            </div>
          </div>
          <footer className="stage-footer">
            <span>
              {notice ||
                `${displayed?.paths.reduce((n, p) => n + p.points.length, 0) || 0} anchors · ${displayed?.paths.reduce((n, p) => n + p.handles.length, 0) || 0} handles`}
            </span>
            <span>
              {settings.width} × {settings.height} px{" "}
              {mode === "construct"
                ? `· ${(time * settings.duration).toFixed(1)}s / ${settings.duration}s`
                : ""}
            </span>
          </footer>
        </main>
      </div>
      {error && (
        <div className="error-toast" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {exportProgress !== null && (
        <div
          className="export-progress"
          role="dialog"
          aria-modal="true"
          aria-label="Exporting MP4"
        >
          <div className="progress-card">
            <h2>Building your film</h2>
            <p>
              {settings.width} × {settings.height} · {settings.fps} fps · H.264
              MP4
            </p>
            <progress max="1" value={exportProgress} />
            <p>
              {Math.round(exportProgress * 100)}% · Rendering every frame in
              order
            </p>
            <button
              autoFocus
              className="secondary"
              onClick={() => abortRef.current?.abort()}
            >
              Cancel export
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
