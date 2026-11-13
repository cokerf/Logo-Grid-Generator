import React, { useState } from "react";
import type { CustomizationOptions } from "../types";
import type { AnalysisOptions } from "./AnalysisLayers";
import type { ExportSettings } from "../services/exporter";
export type Visibility = {
  anchors: boolean;
  handles: boolean;
  outlines: boolean;
  grid: boolean;
  elementGuides: boolean;
  alignment: boolean;
  rulers: boolean;
  snap: boolean;
};
interface Props {
  open: boolean;
  textCount: number;
  onFontUpload: () => void;
  onClearFont: () => void;
  fontName: string;
  onTextDemo: () => void;
  visibility: Visibility;
  setVisibility: (v: Visibility) => void;
  analysis: AnalysisOptions;
  setAnalysis: (v: AnalysisOptions) => void;
  customization: CustomizationOptions;
  setCustomization: (v: CustomizationOptions) => void;
  settings: ExportSettings;
  setSettings: (s: ExportSettings) => void;
  onUpload: () => void;
  onDemo: () => void;
  onExport: (format: "svg" | "png" | "mp4") => void;
  hasSVG: boolean;
  fileName: string;
  pathCount: number;
  plugin: boolean;
  onInsert: () => void;
}
export const Toggle = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (b: boolean) => void;
}) => (
  <label className="toggle-row">
    {label}
    <input
      className="toggle"
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);
export function ControlPanel(p: Props) {
  const [tab, setTab] = useState("Geometry");
  const [format, setFormat] = useState<"svg" | "png" | "mp4">("mp4");
  const { visibility: v, analysis: a, customization: c, settings: s } = p;
  const field = (label: string, child: React.ReactNode) => (
    <label className="field-row">
      {label}
      {child}
    </label>
  );
  const color = (value: string, onChange: (value: string) => void) => (
    <input
      type="color"
      value={value.slice(0, 7)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
  const range = (
    value: number,
    min: number,
    max: number,
    onChange: (v: number) => void,
    step = 1,
  ) => (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
  return (
    <aside
      className={`inspector ${p.open ? "is-open" : ""}`}
      aria-label="Generator settings"
    >
      <div className="panel-scroll">
        <div className="panel-section source-section">
          <div className="primary-actions">
            <button className="upload-btn" onClick={p.onUpload}>
              Import SVG
            </button>
            <button
              className="create-video"
              disabled={!p.hasSVG}
              onClick={() => p.onExport("mp4")}
            >
              Create video
            </button>
          </div>
          <div className="file-meta">
            <span title={p.fileName}>{p.fileName}</span>
            <span>
              {p.pathCount} paths
              {p.textCount ? ` · ${p.textCount} live text` : ""}
            </span>
          </div>
          <div className="layer-gallery" aria-label="Construction layers">
            {(
              [
                ["curves", "Bézier trace"],
                ["curvature", "Curvature comb"],
                ["spines", "Tangent spines"],
                ["circles", "Radius circles"],
              ] as const
            ).map(([key, label], index) => (
              <button
                className={`layer-card ${a[key] ? "active" : ""}`}
                key={key}
                aria-pressed={a[key]}
                onClick={() => p.setAnalysis({ ...a, [key]: !a[key] })}
              >
                <span className="layer-thumb">
                  <svg viewBox="0 0 120 110" fill="none" aria-hidden="true">
                    <path
                      d="M20 79C20 17 100 17 100 79"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    {index === 0 ? (
                      <>
                        <path
                          d="M20 79V17M100 79V17M20 17H100"
                          stroke="currentColor"
                          opacity=".35"
                        />
                        <circle cx="20" cy="79" r="3" fill="currentColor" />
                        <circle cx="100" cy="79" r="3" fill="currentColor" />
                        <circle cx="20" cy="17" r="2" fill="currentColor" />
                        <circle cx="100" cy="17" r="2" fill="currentColor" />
                      </>
                    ) : index === 1 ? (
                      <>
                        {Array.from({ length: 15 }, (_, i) => {
                          const t = (i / 14) * Math.PI;
                          return (
                            <path
                              key={i}
                              d={`M${60 + 40 * Math.cos(t)} ${79 - 46 * Math.sin(t)}L${60 + 53 * Math.cos(t)} ${79 - 62 * Math.sin(t)}`}
                              stroke="currentColor"
                              opacity=".65"
                            />
                          );
                        })}
                        <path
                          d="M7 79C7-3 113-3 113 79"
                          stroke="currentColor"
                          opacity=".4"
                        />
                      </>
                    ) : index === 2 ? (
                      <path
                        d="M7 60L31 96M24 24L48 58M54 18L66 48M73 27L104 48M90 58L114 82"
                        stroke="currentColor"
                        strokeDasharray="3 2"
                      />
                    ) : (
                      <>
                        <circle
                          cx="60"
                          cy="69"
                          r="39"
                          stroke="currentColor"
                          opacity=".5"
                        />
                        <circle
                          cx="37"
                          cy="75"
                          r="20"
                          stroke="currentColor"
                          opacity=".3"
                        />
                        <path
                          d="M60 20V103M10 69H108"
                          stroke="currentColor"
                          opacity=".2"
                        />
                      </>
                    )}
                  </svg>
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="font-controls">
            <span>{p.fontName || "SVG text & fonts"}</span>
            <div>
              <button onClick={p.onFontUpload}>Upload font</button>
              {p.fontName && <button onClick={p.onClearFont}>Reset</button>}
              <button onClick={p.onTextDemo}>Try live text</button>
            </div>
          </div>
          {p.textCount > 0 && (
            <p className="hint">
              Text stays live. Upload the original font if the lettering looks
              different. Curve controls apply to vector paths.
            </p>
          )}
        </div>
        <div className="panel-section">
          <div className="tabs" role="tablist">
            {["Geometry", "Style", "Export"].map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={t === tab}
                className={t === tab ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Geometry" && (
            <>
              <div className="section-title">
                <span>CONSTRUCTION LAYERS</span>
                <span>01</span>
              </div>
              {(
                [
                  ["curves", "Bézier trace"],
                  ["curvature", "Curvature comb"],
                  ["spines", "Tangent spines"],
                  ["circles", "Radius circles"],
                ] as const
              ).map(([key, label]) => (
                <Toggle
                  key={key}
                  label={label}
                  value={a[key]}
                  onChange={(b) => p.setAnalysis({ ...a, [key]: b })}
                />
              ))}
              {field(
                "Sampling",
                range(a.samples, 12, 100, (b) =>
                  p.setAnalysis({ ...a, samples: b }),
                ),
              )}
              {field(
                "Comb scale",
                range(
                  a.gain,
                  0.2,
                  4,
                  (b) => p.setAnalysis({ ...a, gain: b }),
                  0.1,
                ),
              )}
              <p className="hint">
                Curvature and tangents calculated from your vector paths with
                Paper.js.
              </p>
            </>
          )}
          {tab === "Style" && (
            <>
              <div className="section-title">
                <span>APPEARANCE</span>
                <span>02</span>
              </div>
              <div className="button-row">
                {[
                  ["Paper", "#f2f1eb", "#202822", "#597e45"],
                  ["Blueprint", "#122b47", "#b4def5", "#7eb6e1"],
                  ["Ink", "#161c18", "#d8e2d2", "#c6f566"],
                ].map(([name, bg, fg, accent]) => (
                  <button
                    key={name}
                    onClick={() => {
                      p.setCustomization({
                        ...c,
                        canvasBackground: bg,
                        useOriginalColors: false,
                        fillColor: fg + "22",
                        path: { ...c.path, stroke: fg },
                        anchors: { ...c.anchors, color: accent },
                        handles: { ...c.handles, color: accent },
                        gridlines: { ...c.gridlines, color: fg + "24" },
                        rulers: { background: bg, text: fg + "80" },
                      });
                      p.setAnalysis({ ...a, color: accent });
                    }}
                  >
                    <span className="palette-strip" style={{background:`linear-gradient(90deg,${bg} 0% 25%,${fg} 25% 50%,${accent} 50% 75%,${bg} 75%)`}}/>{name}
                  </button>
                ))}
              </div>
              <Toggle
                label="Original logo colours"
                value={!!c.useOriginalColors}
                onChange={(value) =>
                  p.setCustomization({ ...c, useOriginalColors: value })
                }
              />
              <Toggle
                label="Logo fill"
                value={c.showFill}
                onChange={(b) => p.setCustomization({ ...c, showFill: b })}
              />
              {field(
                "Canvas",
                color(c.canvasBackground, (b) =>
                  p.setCustomization({ ...c, canvasBackground: b }),
                ),
              )}
              {field(
                "Logo fill",
                color(c.fillColor, (b) =>
                  p.setCustomization({
                    ...c,
                    useOriginalColors: false,
                    fillColor: b,
                  }),
                ),
              )}
              {field(
                "Logo stroke",
                color(c.path.stroke, (b) =>
                  p.setCustomization({ ...c, path: { ...c.path, stroke: b } }),
                ),
              )}
              {field(
                "Curve accent",
                color(a.color, (b) => p.setAnalysis({ ...a, color: b })),
              )}
              {field(
                "Grid color",
                color(c.gridlines.color, (b) =>
                  p.setCustomization({
                    ...c,
                    gridlines: { ...c.gridlines, color: b + "50" },
                  }),
                ),
              )}
              {field(
                "Stroke width",
                range(
                  c.path.strokeWidth,
                  0.1,
                  4,
                  (b) =>
                    p.setCustomization({
                      ...c,
                      path: { ...c.path, strokeWidth: b },
                    }),
                  0.1,
                ),
              )}
              {field(
                "Anchor size",
                range(
                  c.anchors.size,
                  0.5,
                  10,
                  (b) =>
                    p.setCustomization({
                      ...c,
                      anchors: { ...c.anchors, size: b },
                    }),
                  0.5,
                ),
              )}
              {field(
                "Anchor shape",
                <select
                  value={c.anchors.shape}
                  onChange={(e) =>
                    p.setCustomization({
                      ...c,
                      anchors: {
                        ...c.anchors,
                        shape: e.target.value as "circle" | "square",
                      },
                    })
                  }
                >
                  <option value="square">Square</option>
                  <option value="circle">Circle</option>
                </select>,
              )}
            </>
          )}
          {tab === "Export" && (
            <>
              <div className="section-title">
                <span>EXPORT CANVAS</span>
                <span>03</span>
              </div>
              {field(
                "Format",
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                >
                  <option value="mp4">Construction · MP4</option>
                  <option value="png">Still · PNG</option>
                  <option value="svg">Vector · SVG</option>
                </select>,
              )}
              {field(
                "Size preset",
                <select
                  value={`${s.width}x${s.height}`}
                  onChange={(e) => {
                    if (e.target.value === "custom") return;
                    const [width, height] = e.target.value
                      .split("x")
                      .map(Number);
                    p.setSettings({ ...s, width, height });
                  }}
                >
                  <option value="custom">Custom</option>
                  {[
                    [1080, 1350],
                    [1080, 1080],
                    [1080, 1920],
                    [1920, 1080],
                    [2160, 2700],
                    [3840, 2160],
                  ].map(([w, h]) => (
                    <option key={`${w}x${h}`} value={`${w}x${h}`}>
                      {w} × {h}
                    </option>
                  ))}
                </select>,
              )}
              <div className="dimension-row">
                <label>
                  WIDTH
                  <input
                    aria-label="Export width"
                    type="number"
                    min="16"
                    max="8192"
                    step="2"
                    value={s.width}
                    onChange={(e) =>
                      p.setSettings({ ...s, width: Number(e.target.value) })
                    }
                  />
                </label>
                <span>×</span>
                <label>
                  HEIGHT
                  <input
                    aria-label="Export height"
                    type="number"
                    min="16"
                    max="8192"
                    step="2"
                    value={s.height}
                    onChange={(e) =>
                      p.setSettings({ ...s, height: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              {format === "mp4" ? (
                <>
                  {field(
                    "Duration",
                    <select
                      value={s.duration}
                      onChange={(e) =>
                        p.setSettings({
                          ...s,
                          duration: Number(e.target.value),
                        })
                      }
                    >
                      {[3, 5, 8, 10, 15, 20, 30].map((n) => (
                        <option key={n} value={n}>
                          {n} seconds
                        </option>
                      ))}
                    </select>,
                  )}
                  {field(
                    "Frame rate",
                    <select
                      value={s.fps}
                      onChange={(e) =>
                        p.setSettings({ ...s, fps: Number(e.target.value) })
                      }
                    >
                      {[24, 30, 60].map((n) => (
                        <option key={n} value={n}>
                          {n} fps
                        </option>
                      ))}
                    </select>,
                  )}
                  {field(
                    "Quality",
                    <select
                      value={s.quality}
                      onChange={(e) =>
                        p.setSettings({
                          ...s,
                          quality: e.target.value as typeof s.quality,
                        })
                      }
                    >
                      <option value="standard">Standard</option>
                      <option value="high">High</option>
                    </select>,
                  )}
                  {field(
                    "Finish",
                    <select
                      value={s.ending}
                      onChange={(e) =>
                        p.setSettings({
                          ...s,
                          ending: e.target.value as typeof s.ending,
                        })
                      }
                    >
                      <option value="hold">Hold construction</option>
                      <option value="clean">Reveal clean logo</option>
                    </select>,
                  )}
                  <p className="hint">
                    Frame-by-frame H.264 encoding, with fast-start MP4 playback.
                    The export can take longer than the video itself.
                  </p>
                </>
              ) : (
                <Toggle
                  label="Transparent background"
                  value={s.transparent}
                  onChange={(b) => p.setSettings({ ...s, transparent: b })}
                />
              )}
              <Toggle
                label="Include alignment guides"
                value={s.includeGuides}
                onChange={(b) => p.setSettings({ ...s, includeGuides: b })}
              />
              <button
                className="export-btn"
                disabled={!p.hasSVG}
                onClick={() => p.onExport(format)}
              >
                Export {format.toUpperCase()}
              </button>
              {p.plugin && (
                <button
                  className="secondary"
                  style={{ width: "100%", marginTop: 8 }}
                  onClick={p.onInsert}
                  disabled={!p.hasSVG}
                >
                  Insert editable construction in Figma
                </button>
              )}
            </>
          )}
        </div>
        {tab !== "Export" && (
          <div className="panel-section">
            <div className="section-title">
              <span>{tab === "Geometry" ? "WORKSPACE" : "GRID"}</span>
              <span>⌘</span>
            </div>
            {tab === "Geometry" ? (
              <>
                {(
                  [
                    ["anchors", "Anchor points"],
                    ["handles", "Control handles"],
                    ["outlines", "Bounding boxes"],
                    ["grid", "Canvas grid"],
                    ["alignment", "Alignment guides"],
                    ["elementGuides", "Selected path guides"],
                    ["rulers", "Rulers"],
                    ["snap", "Snap to grid"],
                  ] as const
                ).map(([key, label]) => (
                  <Toggle
                    key={key}
                    label={label}
                    value={v[key]}
                    onChange={(b) => p.setVisibility({ ...v, [key]: b })}
                  />
                ))}
              </>
            ) : (
              <>
                {field(
                  "Grid type",
                  <select
                    value={c.gridlines.type}
                    onChange={(e) =>
                      p.setCustomization({
                        ...c,
                        gridlines: {
                          ...c.gridlines,
                          type: e.target.value as "square" | "columns",
                        },
                      })
                    }
                  >
                    <option value="square">Square</option>
                    <option value="columns">Columns / rows</option>
                  </select>,
                )}
                {field(
                  "Grid style",
                  <select
                    value={c.gridlines.style}
                    onChange={(e) =>
                      p.setCustomization({
                        ...c,
                        gridlines: {
                          ...c.gridlines,
                          style: e.target.value as "lines" | "dots",
                        },
                      })
                    }
                  >
                    <option value="lines">Lines</option>
                    <option value="dots">Dots</option>
                  </select>,
                )}
                {c.gridlines.type === "square" ? (
                  field(
                    "Density",
                    range(c.gridlines.density, 4, 60, (b) =>
                      p.setCustomization({
                        ...c,
                        gridlines: { ...c.gridlines, density: b },
                      }),
                    ),
                  )
                ) : (
                  <>
                    {field(
                      "Columns",
                      range(c.gridlines.columns, 2, 40, (b) =>
                        p.setCustomization({
                          ...c,
                          gridlines: { ...c.gridlines, columns: b },
                        }),
                      ),
                    )}
                    {field(
                      "Rows",
                      range(c.gridlines.rows, 2, 40, (b) =>
                        p.setCustomization({
                          ...c,
                          gridlines: { ...c.gridlines, rows: b },
                        }),
                      ),
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
        <div className="panel-section">
          <button
            className="secondary"
            style={{ width: "100%" }}
            onClick={p.onDemo}
          >
            Load example logo
          </button>
          <p className="hint">
            Drag paths or control handles to refine geometry. Undo with Ctrl / ⌘
            Z.
          </p>
        </div>
      </div>
      <footer className="panel-footer">
        <span>Logo Grid Generator</span>
        <span>v2.0</span>
      </footer>
    </aside>
  );
}
