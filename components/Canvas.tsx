
import React from 'react';
import type { ParsedSVG, Point, Handle } from '../types';

interface CanvasProps {
  svgData: ParsedSVG | null;
  showAnchors: boolean;
  showHandles: boolean;
  showOutlines:boolean;
  showGridlines: boolean;
  onUploadClick: () => void;
  error: string | null;
}

const ANCHOR_SIZE = 8;

const Gridlines: React.FC<{ width: number, height: number }> = ({ width, height }) => {
    const step = Math.min(width, height) / 20;
    const lines = [];

    for (let i = 0; i <= width; i += step) {
        lines.push(<line key={`v-${i}`} x1={i} y1={0} x2={i} y2={height} className="stroke-slate-700/70" strokeWidth="0.5" />);
    }
    for (let i = 0; i <= height; i += step) {
        lines.push(<line key={`h-${i}`} x1={0} y1={i} x2={width} y2={i} className="stroke-slate-700/70" strokeWidth="0.5" />);
    }
    return <g>{lines}</g>;
};

const Anchors: React.FC<{ points: Point[] }> = ({ points }) => (
  <g>
    {points.map((p, i) => (
      <rect 
        key={i} 
        x={p.x - ANCHOR_SIZE / 2} 
        y={p.y - ANCHOR_SIZE / 2} 
        width={ANCHOR_SIZE} 
        height={ANCHOR_SIZE} 
        className="fill-cyan-400 stroke-slate-900" 
        strokeWidth="1" 
      />
    ))}
  </g>
);

const Handles: React.FC<{ handles: Handle[] }> = ({ handles }) => (
    <g>
        {handles.map((h, i) => (
            <React.Fragment key={i}>
                <line x1={h.start.x} y1={h.start.y} x2={h.end.x} y2={h.end.y} className="stroke-fuchsia-500" strokeWidth="1" />
                <circle cx={h.end.x} cy={h.end.y} r={ANCHOR_SIZE / 2.5} className="fill-fuchsia-500 stroke-slate-900" strokeWidth="1" />
            </React.Fragment>
        ))}
    </g>
);

const Outlines: React.FC<{ path: { boundingBox: SVGRect | null } }> = ({ path }) => {
    if (!path.boundingBox) return null;
    const { x, y, width, height } = path.boundingBox;
    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            className="fill-none stroke-red-500"
            strokeWidth="1"
            strokeDasharray="4 2"
        />
    );
};


export const Canvas: React.FC<CanvasProps> = ({ svgData, showAnchors, showHandles, showOutlines, showGridlines, onUploadClick, error }) => {
  if (error) {
    return (
        <div className="w-full h-full max-w-3xl bg-slate-800/50 rounded-lg border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center p-8 text-center text-red-400">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-slate-300">{error}</p>
        </div>
    );
  }
  
  if (!svgData) {
    return (
      <div className="w-full h-full max-w-3xl bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700/80 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-bold text-slate-300 mb-2">Logo Grid Generator</h2>
        <p className="mb-6">Upload an SVG file to begin analyzing its structure.</p>
        <button
          onClick={onUploadClick}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Upload SVG
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 flex items-center justify-center">
      <svg
        viewBox={svgData.viewBox}
        className="max-w-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {showGridlines && <Gridlines width={svgData.width} height={svgData.height} />}

        {svgData.paths.map((path, i) => (
          <g key={i}>
            <path d={path.d} className="fill-blue-500/20 stroke-blue-400" strokeWidth="1" />
            {showOutlines && <Outlines path={path} />}
            {showAnchors && <Anchors points={path.points} />}
            {showHandles && <Handles handles={path.handles} />}
          </g>
        ))}
      </svg>
    </div>
  );
};
