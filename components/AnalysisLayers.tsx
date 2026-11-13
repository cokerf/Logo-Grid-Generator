import React, { useMemo } from "react";
import { analyzePath } from "../services/geometry";
import type { Bounds } from "../services/drafting";
import type { ParsedSVG } from "../types";
export interface AnalysisOptions {
  curves: boolean;
  dimensions: boolean;
  spines: boolean;
  circles: boolean;
  samples: number;
  gain: number;
  color: string;
}
export function AnalysisLayers({
  data,
  options,
  viewport,
}: {
  data: ParsedSVG;
  options: AnalysisOptions;
  viewport: Bounds;
}) {
  const scale = Math.max(data.width, data.height);
  const analysis = useMemo(
    () =>
      options.spines || options.circles
        ? data.paths.map((p) =>
            analyzePath(p.d, scale, options.samples, options.gain,viewport),
          )
        : [],
    [
      data,
      scale,
      options.spines,
      options.circles,
      options.samples,
      options.gain,
      viewport,
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
      {options.dimensions && (() => {
        const boxes = data.paths.map(p=>p.boundingBox).filter((b): b is SVGRect=>!!b);
        if(!boxes.length)return null;
        const x=Math.min(...boxes.map(b=>b.x)), y=Math.min(...boxes.map(b=>b.y)),
          right=Math.max(...boxes.map(b=>b.x+b.width)), bottom=Math.max(...boxes.map(b=>b.y+b.height)),
          gap=scale*.055*options.gain, tick=scale*.008, tx=right+gap, ty=bottom+gap;
        return <g data-stage="3" data-dimensions="true" opacity=".8" strokeWidth={scale*.0009}>
          <path d={`M${x} ${bottom}V${ty+tick*2}M${right} ${bottom}V${ty+tick*2}M${x} ${ty}H${right}M${right} ${y}H${tx+tick*2}M${right} ${bottom}H${tx+tick*2}M${tx} ${y}V${bottom}`} />
          {[x,right].map((a,i)=><path key={'h'+i} d={`M${a-tick} ${ty+tick}l${tick*2} ${-tick*2}`}/>)}
          {[y,bottom].map((a,i)=><path key={'v'+i} d={`M${tx-tick} ${a+tick}l${tick*2} ${-tick*2}`}/>)}
          <g fill={options.color} stroke="none" fontFamily="Archivo,Arial,sans-serif" fontSize={scale*.018} textAnchor="middle">
            <text x={(x+right)/2} y={ty+scale*.025}>{Number((right-x).toFixed(1))} u</text>
            <text transform={`translate(${tx+scale*.025} ${(y+bottom)/2}) rotate(-90)`}>{Number((bottom-y).toFixed(1))} u</text>
          </g>
        </g>;
      })()}
      {options.spines && (
        <g
          data-stage="1"
          data-tangent-spines="true"
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
