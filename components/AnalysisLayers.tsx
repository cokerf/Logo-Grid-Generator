import React, { useMemo } from "react";
import { analyzePath } from "../services/geometry";
import type { ParsedSVG } from "../types";
export interface AnalysisOptions {
  curves: boolean;
  curvature: boolean;
  spines: boolean;
  circles: boolean;
  samples: number;
  gain: number;
  color: string;
}
export function AnalysisLayers({
  data,
  options,
}: {
  data: ParsedSVG;
  options: AnalysisOptions;
}) {
  const scale = Math.max(data.width, data.height);
  const analysis = useMemo(
    () =>
      options.curvature || options.spines || options.circles
        ? data.paths.map((p) =>
            analyzePath(p.d, scale, options.samples, options.gain),
          )
        : [],
    [
      data,
      scale,
      options.curvature,
      options.spines,
      options.circles,
      options.samples,
      options.gain,
    ],
  );
  return (
    <g
      fill="none"
      stroke={options.color}
      strokeWidth={scale * 0.0012}
      pointerEvents="none"
    >
      {options.curves && (
        <g data-stage="2" opacity=".9">
          {data.paths.map((p, i) => (
            <path key={i} d={p.d} />
          ))}
        </g>
      )}
      {options.curvature && (
        <g data-stage="3" opacity=".7">
          {analysis.map((a, i) => (
            <g key={i}>
              <path d={a.comb} strokeWidth={scale * 0.0006} />
              <path d={a.envelope} />
            </g>
          ))}
        </g>
      )}
      {options.spines && (
        <g
          data-stage="1"
          strokeDasharray={`${scale * 0.007} ${scale * 0.004}`}
          opacity=".6"
        >
          {analysis.flatMap((a, i) =>
            a.spines.map((d, j) => <path key={`${i}-${j}`} d={d} />),
          )}
        </g>
      )}
      {options.circles && (
        <g data-stage="1" opacity=".28">
          {analysis.flatMap((a, i) =>
            a.circles.map((c, j) => (
              <circle key={`${i}-${j}`} cx={c.x} cy={c.y} r={c.r} />
            )),
          )}
        </g>
      )}
    </g>
  );
}
