
import React, { useState, MouseEvent, useMemo } from 'react';
import type { ParsedSVG, Point, Handle, CustomizationOptions, SVGPathData } from '../types';

interface CanvasProps {
  svgData: ParsedSVG | null;
  svgRef: React.RefObject<SVGSVGElement>;
  showAnchors: boolean;
  showHandles: boolean;
  showOutlines: boolean;
  showGridlines: boolean;
  showElementGuides: boolean;
  showAlignmentGuides: boolean;
  error: string | null;
  customization: CustomizationOptions;
  onHandleMove: (pathIndex: number, handleIndex: number, newPosition: Point) => void;
  onPathMove: (pathIndex: number, delta: Point) => void;
  snapToGrid: boolean;
  selectedPathIndex: number | null;
  setSelectedPathIndex: (index: number | null) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const Grid: React.FC<{ viewBox: {x:number, y:number, width: number, height: number}, options: CustomizationOptions['gridlines'] }> = ({ viewBox, options }) => {
    const items = [];
    const { x, y, width, height } = viewBox;

    if (options.type === 'square') {
        const density = Math.max(1, options.density);
        const step = Math.min(width, height) / density;
        if (step > 0) {
            if (options.style === 'lines') {
                for (let i = 0; i <= width + 0.001; i += step) {
                    items.push(<line key={`v-${i}`} x1={x + i} y1={y} x2={x + i} y2={y + height} stroke={options.color} strokeWidth={options.width} />);
                }
                for (let i = 0; i <= height + 0.001; i += step) {
                    items.push(<line key={`h-${i}`} x1={x} y1={y + i} x2={x + width} y2={y + i} stroke={options.color} strokeWidth={options.width} />);
                }
            } else { // Dots
                for (let i = 0; i <= width + 0.001; i += step) {
                    for (let j = 0; j <= height + 0.001; j += step) {
                        items.push(<circle key={`d-${i}-${j}`} cx={x + i} cy={y + j} r={options.width} fill={options.color} />);
                    }
                }
            }
        }
    } else { // Columns & Rows
        const cols = Math.max(1, options.columns);
        const rows = Math.max(1, options.rows);
        const colStep = width / cols;
        const rowStep = height / rows;

        if (options.style === 'lines') {
            for (let i = 0; i <= cols; i++) {
                items.push(<line key={`v-${i}`} x1={x + i * colStep} y1={y} x2={x + i * colStep} y2={y + height} stroke={options.color} strokeWidth={options.width} />);
            }
            for (let i = 0; i <= rows; i++) {
                items.push(<line key={`h-${i}`} x1={x} y1={y + i * rowStep} x2={x + width} y2={y + i * rowStep} stroke={options.color} strokeWidth={options.width} />);
            }
        } else { // Dots
             for (let i = 0; i <= cols; i++) {
                for (let j = 0; j <= rows; j++) {
                    items.push(<circle key={`d-${i}-${j}`} cx={x + i * colStep} cy={y + j * rowStep} r={options.width} fill={options.color} />);
                }
            }
        }
    }
    return <g>{items}</g>;
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

const Outlines: React.FC<{ path: { boundingBox: SVGRect | null }, options: CustomizationOptions['outlines'], isSelected: boolean }> = ({ path, options, isSelected }) => {
    if (!path.boundingBox) return null;
    const { x, y, width, height } = path.boundingBox;
    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="none"
            stroke={isSelected ? '#007AFF' : options.color}
            strokeWidth={isSelected ? options.width * 1.5 : options.width}
            strokeDasharray={options.style === 'dashed' ? '4 2' : 'none'}
        />
    );
};

const ElementGuides: React.FC<{
  path: SVGPathData;
  viewBox: { x: number; y: number; width: number; height: number };
  options: CustomizationOptions['elementGuides'];
}> = ({ path, viewBox, options }) => {
  if (!path.boundingBox) return null;
  const { x, y, width, height } = path.boundingBox;

  const midX = x + width / 2;
  const midY = y + height / 2;
  
  const commonProps = {
    stroke: options.color,
    strokeWidth: options.width,
    strokeDasharray: options.style === 'dashed' ? '4 2' : 'none',
  };

  return (
    <g id="element-guides">
      {/* Vertical lines */}
      <line x1={x} y1={viewBox.y} x2={x} y2={viewBox.y + viewBox.height} {...commonProps} />
      <line x1={midX} y1={viewBox.y} x2={midX} y2={viewBox.y + viewBox.height} {...commonProps} />
      <line x1={x + width} y1={viewBox.y} x2={x + width} y2={viewBox.y + viewBox.height} {...commonProps} />
      
      {/* Horizontal lines */}
      <line x1={viewBox.x} y1={y} x2={viewBox.x + viewBox.width} y2={y} {...commonProps} />
      <line x1={viewBox.x} y1={midY} x2={viewBox.x + viewBox.width} y2={midY} {...commonProps} />
      <line x1={viewBox.x} y1={y + height} x2={viewBox.x + viewBox.width} y2={y + height} {...commonProps} />

      {/* Diagonal lines */}
      <line x1={x} y1={y} x2={x + width} y2={y + height} {...commonProps} />
      <line x1={x + width} y1={y} x2={x} y2={y + height} {...commonProps} />
    </g>
  );
};

const AlignmentGuides: React.FC<{
  paths: SVGPathData[];
  viewBox: { x: number; y: number; width: number; height: number };
  options: CustomizationOptions['alignmentGuides'];
}> = ({ paths, viewBox, options }) => {
  const commonProps = {
    stroke: options.color,
    strokeWidth: options.width,
    strokeDasharray: options.style === 'dashed' ? '4 2' : 'none',
  };

  const guides = paths.flatMap((path, i) => {
    if (!path.boundingBox) return [];
    const { x, y, width, height } = path.boundingBox;
    const midX = x + width / 2;
    const midY = y + height / 2;
    return [
      // Vertical
      <line key={`av-${i}-1`} x1={x} y1={viewBox.y} x2={x} y2={viewBox.y + viewBox.height} {...commonProps} />,
      <line key={`av-${i}-2`} x1={midX} y1={viewBox.y} x2={midX} y2={viewBox.y + viewBox.height} {...commonProps} />,
      <line key={`av-${i}-3`} x1={x + width} y1={viewBox.y} x2={x + width} y2={viewBox.y + viewBox.height} {...commonProps} />,
      // Horizontal
      <line key={`ah-${i}-1`} x1={viewBox.x} y1={y} x2={viewBox.x + viewBox.width} y2={y} {...commonProps} />,
      <line key={`ah-${i}-2`} x1={viewBox.x} y1={midY} x2={viewBox.x + viewBox.width} y2={midY} {...commonProps} />,
      <line key={`ah-${i}-3`} x1={viewBox.x} y1={y + height} x2={viewBox.x + viewBox.width} y2={y + height} {...commonProps} />,
      // Diagonal
      <line key={`ad-${i}-1`} x1={x} y1={y} x2={x + width} y2={y + height} {...commonProps} />,
      <line key={`ad-${i}-2`} x1={x + width} y1={y} x2={x} y2={y + height} {...commonProps} />,
    ];
  });

  return <g id="alignment-guides">{guides}</g>;
};


export const Canvas: React.FC<CanvasProps> = ({ 
  svgData, svgRef, showAnchors, showHandles, showOutlines, showGridlines, showElementGuides, showAlignmentGuides, error, customization, 
  onHandleMove, onPathMove, snapToGrid, selectedPathIndex, setSelectedPathIndex, onDragStart, onDragEnd 
}) => {
  const [dragState, setDragState] = useState<{ type: 'handle' | 'path', index: number, pathIndex: number, startPoint: Point } | null>(null);

  const viewBox = useMemo(() => {
    if (!svgData) return { x: 0, y: 0, width: 0, height: 0 };
    const parts = svgData.viewBox.split(' ').map(parseFloat);
    return { x: parts[0] || 0, y: parts[1] || 0, width: parts[2] || 0, height: parts[3] || 0 };
  }, [svgData]);

  const gridStep = useMemo(() => {
    if (!svgData) return 1;
    // Snap to the custom grid if it's column/row based
    if(showGridlines && customization.gridlines.type === 'columns') {
       return Math.min(viewBox.width / customization.gridlines.columns, viewBox.height / customization.gridlines.rows);
    }
     if(showGridlines && customization.gridlines.type === 'square') {
       return Math.min(viewBox.width, viewBox.height) / customization.gridlines.density;
    }
    return Math.min(svgData.width, svgData.height) / 20;
  }, [svgData, showGridlines, customization.gridlines, viewBox]);

  const getSVGPoint = (e: MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformedPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    return { x: transformedPt.x, y: transformedPt.y };
  };

  const snap = (coord: number, origin: number = 0) => {
    return Math.round((coord - origin) / gridStep) * gridStep + origin;
  };

  const handleMouseDown = (e: MouseEvent, type: 'handle' | 'path', pathIndex: number, index: number) => {
    e.stopPropagation();
    setSelectedPathIndex(pathIndex);
    setDragState({ type, index, pathIndex, startPoint: getSVGPoint(e) });
    onDragStart();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState) return;

    const currentPoint = getSVGPoint(e);
    let newPos = { ...currentPoint };

    if (dragState.type === 'handle') {
      if (snapToGrid) {
        newPos = { x: snap(currentPoint.x, viewBox.x), y: snap(currentPoint.y, viewBox.y) };
      }
      onHandleMove(dragState.pathIndex, dragState.index, newPos);
    } 
    
    if (dragState.type === 'path') {
      const delta = {
        x: currentPoint.x - dragState.startPoint.x,
        y: currentPoint.y - dragState.startPoint.y
      };

      // Apply snapping to the delta
      if (snapToGrid) {
        const snappedStart = { x: snap(dragState.startPoint.x, viewBox.x), y: snap(dragState.startPoint.y, viewBox.y) };
        const snappedCurrent = { x: snap(currentPoint.x, viewBox.x), y: snap(currentPoint.y, viewBox.y) };
        delta.x = snappedCurrent.x - snappedStart.x;
        delta.y = snappedCurrent.y - snappedStart.y;
        if(Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0) {
            onPathMove(dragState.pathIndex, delta);
            setDragState({ ...dragState, startPoint: currentPoint }); // Update start point to prevent cumulative snapping errors
        }
      } else {
        onPathMove(dragState.pathIndex, delta);
        setDragState({ ...dragState, startPoint: currentPoint });
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState) {
      onDragEnd();
    }
    setDragState(null);
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
        <p className="mb-6">Upload an SVG file to begin.</p>
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
        {showGridlines && <Grid viewBox={viewBox} options={customization.gridlines} />}
        {showAlignmentGuides && svgData && <AlignmentGuides paths={svgData.paths} viewBox={viewBox} options={customization.alignmentGuides} />}

        {showElementGuides && selectedPathIndex !== null && svgData.paths[selectedPathIndex] && (
          <ElementGuides 
            path={svgData.paths[selectedPathIndex]} 
            viewBox={viewBox}
            options={customization.elementGuides} 
          />
        )}

        {svgData.paths.map((path, i) => {
            const isSelected = i === selectedPathIndex;
            const fillColor = customization.showFill ? customization.fillColor : 'none';
            return (
                <g key={i}>
                    <path 
                      d={path.d} 
                      fill={fillColor} 
                      stroke={isSelected ? '#007AFF' : customization.path.stroke} 
                      strokeWidth={isSelected ? customization.path.strokeWidth * 1.5 : customization.path.strokeWidth}
                      onMouseDown={(e) => handleMouseDown(e, 'path', i, i)}
                      style={{ cursor: 'move' }}
                    />
                    {showOutlines && <Outlines path={path} options={customization.outlines} isSelected={isSelected} />}
                    {showAnchors && <Anchors points={path.points} options={customization.anchors} />}
                    {showHandles && path.handles.length > 0 && <Handles pathIndex={i} handles={path.handles} options={customization.handles} anchorOptions={customization.anchors} onMouseDown={(e, pIdx, hIdx) => handleMouseDown(e, 'handle', pIdx, hIdx)} />}
                </g>
            )
        })}
      </svg>
    </div>
  );
};
