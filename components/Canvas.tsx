import React, { useState, MouseEvent } from 'react';
import type { ParsedSVG, Point, Handle, CustomizationOptions } from '../types';

interface CanvasProps {
  svgData: ParsedSVG | null;
  svgRef: React.RefObject<SVGSVGElement>;
  showAnchors: boolean;
  showHandles: boolean;
  showOutlines: boolean;
  showGridlines: boolean;
  error: string | null;
  customization: CustomizationOptions;
  onHandleMove: (pathIndex: number, handleIndex: number, newPosition: Point) => void;
}

const Gridlines: React.FC<{ width: number, height: number, options: CustomizationOptions['gridlines'] }> = ({ width, height, options }) => {
    const step = Math.min(width, height) / 20;
    const lines = [];

    for (let i = 0; i <= width; i += step) {
        lines.push(<line key={`v-${i}`} x1={i} y1={0} x2={i} y2={height} stroke={options.color} strokeWidth={options.width} />);
    }
    for (let i = 0; i <= height; i += step) {
        lines.push(<line key={`h-${i}`} x1={0} y1={i} x2={width} y2={i} stroke={options.color} strokeWidth={options.width} />);
    }
    return <g>{lines}</g>;
};

const Anchors: React.FC<{ points: Point[], options: CustomizationOptions['anchors'] }> = ({ points, options }) => (
  <g>
    {points.map((p, i) => (
      options.shape === 'square' ? (
        <rect 
          key={i} 
          x={p.x - options.size / 2} 
          y={p.y - options.size / 2} 
          width={options.size} 
          height={options.size} 
          fill={options.color}
          stroke={'#FFF'}
          strokeWidth="1" 
        />
      ) : (
        <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={options.size / 2}
            fill={options.color}
            stroke={'#FFF'}
            strokeWidth="1"
        />
      )
    ))}
  </g>
);

const Handles: React.FC<{ 
    pathIndex: number;
    handles: Handle[], 
    options: CustomizationOptions['handles'], 
    anchorOptions: CustomizationOptions['anchors'],
    onMouseDown: (e: MouseEvent, pathIndex: number, handleIndex: number) => void;
}> = ({ pathIndex, handles, options, anchorOptions, onMouseDown }) => (
    <g>
        {handles.map((h, i) => (
            <React.Fragment key={i}>
                <line x1={h.start.x} y1={h.start.y} x2={h.end.x} y2={h.end.y} stroke={options.color} strokeWidth={options.width} />
                <circle 
                  cx={h.end.x} 
                  cy={h.end.y} 
                  r={anchorOptions.size / 2.5} 
                  fill={options.color} 
                  stroke={'#FFF'} 
                  strokeWidth="1" 
                  onMouseDown={(e) => onMouseDown(e, pathIndex, i)}
                  style={{ cursor: 'move' }}
                />
            </React.Fragment>
        ))}
    </g>
);

const Outlines: React.FC<{ path: { boundingBox: SVGRect | null }, options: CustomizationOptions['outlines'] }> = ({ path, options }) => {
    if (!path.boundingBox) return null;
    const { x, y, width, height } = path.boundingBox;
    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="none"
            stroke={options.color}
            strokeWidth={options.width}
            strokeDasharray={options.style === 'dashed' ? '4 2' : 'none'}
        />
    );
};


export const Canvas: React.FC<CanvasProps> = ({ svgData, svgRef, showAnchors, showHandles, showOutlines, showGridlines, error, customization, onHandleMove }) => {
  const [draggedHandle, setDraggedHandle] = useState<{ pathIndex: number; handleIndex: number } | null>(null);

  const getSVGPoint = (e: MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformedPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: transformedPt.x, y: transformedPt.y };
  };

  const handleMouseDown = (e: MouseEvent, pathIndex: number, handleIndex: number) => {
    e.stopPropagation();
    setDraggedHandle({ pathIndex, handleIndex });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedHandle) return;
    const newPos = getSVGPoint(e);
    onHandleMove(draggedHandle.pathIndex, draggedHandle.handleIndex, newPos);
  };

  const handleMouseUp = () => {
    setDraggedHandle(null);
  };

  if (error) {
    return (
        <div className="w-full h-full max-w-3xl bg-gray-200 rounded-lg border-2 border-dashed border-red-500/50 flex flex-col items-center justify-center p-8 text-center text-red-500">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
        </div>
    );
  }
  
  if (!svgData) {
    return (
      <div className="w-full h-full max-w-3xl bg-gray-200/50 rounded-lg border-2 border-dashed border-gray-400 flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-bold text-black mb-2">Logo Grid Generator</h2>
        <p className="mb-6">Select a single vector layer in Figma to begin.</p>
      </div>
    );
  }

  return (
    <div 
        className="w-full h-full p-4 flex items-center justify-center" 
        style={{backgroundColor: customization.canvasBackground}}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        viewBox={svgData.viewBox}
        className="max-w-full max-h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {showGridlines && <Gridlines width={svgData.width} height={svgData.height} options={customization.gridlines} />}

        {svgData.paths.map((path, i) => {
            const fillColor = customization.showFill ? customization.fillColor : 'none';
            return (
                <g key={i}>
                    <path d={path.d} fill={fillColor} stroke={customization.path.stroke} strokeWidth={customization.path.strokeWidth} />
                    {showOutlines && <Outlines path={path} options={customization.outlines} />}
                    {showAnchors && <Anchors points={path.points} options={customization.anchors} />}
                    {showHandles && path.handles.length > 0 && <Handles pathIndex={i} handles={path.handles} options={customization.handles} anchorOptions={customization.anchors} onMouseDown={handleMouseDown} />}
                </g>
            )
        })}
      </svg>
    </div>
  );
};
