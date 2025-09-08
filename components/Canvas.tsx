
import React, { useState, MouseEvent, useMemo, DragEvent, useRef, useLayoutEffect } from 'react';
import type { ParsedSVG, Point, Handle, CustomizationOptions, SVGPathData, Guide } from '../types';

interface CanvasProps {
  svgData: ParsedSVG | null;
  svgRef: React.RefObject<SVGSVGElement>;
  showAnchors: boolean;
  showHandles: boolean;
  showOutlines: boolean;
  showGridlines: boolean;
  showElementGuides: boolean;
  showAlignmentGuides: boolean;
  showRulers: boolean;
  guides: Guide[];
  onAddGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  onUpdateGuide: (id: string, position: number) => void;
  onRemoveGuide: (id: string) => void;
  error: string | null;
  customization: CustomizationOptions;
  onHandleMove: (pathIndex: number, handleIndex: number, newPosition: Point) => void;
  onPathMove: (pathIndex: number, delta: Point) => void;
  snapToGrid: boolean;
  selectedPathIndex: number | null;
  setSelectedPathIndex: (index: number | null) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onFileUpload: (file: File) => void;
  onUploadClick: () => void;
  isDraggingOver: boolean;
  setIsDraggingOver: (isDragging: boolean) => void;
}

type DragState = 
  | { type: 'handle'; index: number; pathIndex: number; startPoint: Point }
  | { type: 'path'; index: number; pathIndex: number; startPoint: Point }
  | { type: 'guide'; id: string; orientation: 'horizontal' | 'vertical'; startPoint: Point }
  | { type: 'new-guide'; orientation: 'horizontal' | 'vertical'; id: string | null };

const RULER_SIZE = 24; // in pixels

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
  svgData, svgRef, showAnchors, showHandles, showOutlines, showGridlines, showElementGuides, showAlignmentGuides, showRulers,
  guides, onAddGuide, onUpdateGuide, onRemoveGuide,
  error, customization, 
  onHandleMove, onPathMove, snapToGrid, selectedPathIndex, setSelectedPathIndex, onDragStart, onDragEnd,
  onFileUpload, onUploadClick, isDraggingOver, setIsDraggingOver
}) => {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const viewBox = useMemo(() => {
    if (!svgData) return { x: 0, y: 0, width: 0, height: 0 };
    const parts = svgData.viewBox.split(' ').map(parseFloat);
    return { x: parts[0] || 0, y: parts[1] || 0, width: parts[2] || 0, height: parts[3] || 0 };
  }, [svgData]);

  const gridStep = useMemo(() => {
    if (!svgData) return 1;
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

  const handleGuideMouseDown = (e: MouseEvent, id: string, orientation: 'horizontal' | 'vertical') => {
    e.stopPropagation();
    setDragState({ type: 'guide', id, orientation, startPoint: getSVGPoint(e) });
  };

  const handleRulerMouseDown = (e: MouseEvent, orientation: 'horizontal' | 'vertical') => {
    e.stopPropagation();
    setDragState({ type: 'new-guide', orientation, id: null });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState) return;
    
    const currentPoint = getSVGPoint(e);

    if (dragState.type === 'new-guide') {
      const newId = Date.now().toString();
      const pos = dragState.orientation === 'horizontal' ? currentPoint.y : currentPoint.x;
      onAddGuide(dragState.orientation, pos);
      setDragState({ type: 'guide', id: newId, orientation: dragState.orientation, startPoint: currentPoint });
      return;
    }
    
    let newPos = { ...currentPoint };

    if (dragState.type === 'handle') {
      if (snapToGrid) {
        newPos = { x: snap(currentPoint.x, viewBox.x), y: snap(currentPoint.y, viewBox.y) };
      }
      onHandleMove(dragState.pathIndex, dragState.index, newPos);
    } 
    
    if (dragState.type === 'path') {
      const delta = { x: currentPoint.x - dragState.startPoint.x, y: currentPoint.y - dragState.startPoint.y };
      if (snapToGrid) {
        const snappedStart = { x: snap(dragState.startPoint.x, viewBox.x), y: snap(dragState.startPoint.y, viewBox.y) };
        const snappedCurrent = { x: snap(currentPoint.x, viewBox.x), y: snap(currentPoint.y, viewBox.y) };
        delta.x = snappedCurrent.x - snappedStart.x;
        delta.y = snappedCurrent.y - snappedStart.y;
        if(Math.abs(delta.x) > 0 || Math.abs(delta.y) > 0) {
            onPathMove(dragState.pathIndex, delta);
            setDragState({ ...dragState, startPoint: currentPoint }); 
        }
      } else {
        onPathMove(dragState.pathIndex, delta);
        setDragState({ ...dragState, startPoint: currentPoint });
      }
    }

    if (dragState.type === 'guide') {
      const svg = svgRef.current;
      const wrapper = canvasWrapperRef.current;
      if (!svg || !wrapper) return;
      
      const svgRect = svg.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();
      
      if (dragState.orientation === 'horizontal') {
        if (e.clientY < (wrapperRect.top + RULER_SIZE) || e.clientY > wrapperRect.bottom) {
          onRemoveGuide(dragState.id);
          setDragState(null);
          return;
        }
        let pos = currentPoint.y;
        if (snapToGrid) pos = snap(pos, viewBox.y);
        onUpdateGuide(dragState.id, pos);
      } else { // vertical
        if (e.clientX < (wrapperRect.left + RULER_SIZE) || e.clientX > wrapperRect.right) {
          onRemoveGuide(dragState.id);
          setDragState(null);
          return;
        }
        let pos = currentPoint.x;
        if (snapToGrid) pos = snap(pos, viewBox.x);
        onUpdateGuide(dragState.id, pos);
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState && (dragState.type === 'path' || dragState.type === 'handle')) {
      onDragEnd();
    }
    setDragState(null);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file && file.type === 'image/svg+xml') {
        onFileUpload(file);
      }
      e.dataTransfer.clearData();
    }
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
      <div 
        className={`w-full h-full max-w-3xl rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-8 text-center text-gray-500 cursor-pointer transition-colors duration-200 ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-400 bg-gray-200/50'}`}
        onClick={onUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload SVG"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-bold text-black mb-2">Logo Grid Generator</h2>
        <p className="mb-6">Drop an SVG file here or click to upload.</p>
      </div>
    );
  }

  return (
    <div 
      ref={canvasWrapperRef}
      className="w-full h-full relative" 
      style={{backgroundColor: customization.canvasBackground}}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {showRulers && <Rulers svgRef={svgRef} viewBox={viewBox} options={customization.rulers} onRulerMouseDown={handleRulerMouseDown} />}
      
      <div 
        className="w-full h-full p-4 flex items-center justify-center" 
        style={{
            paddingTop: showRulers ? RULER_SIZE : 16,
            paddingLeft: showRulers ? RULER_SIZE : 16,
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
      {guides.length > 0 && <Guides svgRef={svgRef} viewBox={viewBox} guides={guides} options={customization.guides} onGuideMouseDown={handleGuideMouseDown} />}
    </div>
  );
};

// --- Rulers and Guides Components ---

const Rulers: React.FC<{
  svgRef: React.RefObject<SVGSVGElement>;
  viewBox: { x: number; y: number; width: number; height: number };
  options: CustomizationOptions['rulers'];
  onRulerMouseDown: (e: MouseEvent, orientation: 'horizontal' | 'vertical') => void;
}> = ({ svgRef, viewBox, options, onRulerMouseDown }) => {
  const hRulerRef = useRef<HTMLCanvasElement>(null);
  const vRulerRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const drawRulers = () => {
      const hCanvas = hRulerRef.current;
      const vCanvas = vRulerRef.current;
      const svg = svgRef.current;
      if (!hCanvas || !vCanvas || !svg) return;
      
      const hCtx = hCanvas.getContext('2d');
      const vCtx = vCanvas.getContext('2d');
      if (!hCtx || !vCtx) return;

      const svgRect = svg.getBoundingClientRect();
      const parentRect = svg.parentElement!.getBoundingClientRect();
      
      const dpr = window.devicePixelRatio || 1;
      hCanvas.width = parentRect.width * dpr;
      hCanvas.height = RULER_SIZE * dpr;
      vCanvas.width = RULER_SIZE * dpr;
      vCanvas.height = parentRect.height * dpr;
      
      hCtx.scale(dpr, dpr);
      vCtx.scale(dpr, dpr);

      const svgLeft = svgRect.left - parentRect.left;
      const svgTop = svgRect.top - parentRect.top;
      const scaleX = svgRect.width / viewBox.width;
      const scaleY = svgRect.height / viewBox.height;

      // Clear rulers
      hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
      vCtx.clearRect(0, 0, vCanvas.width, vCanvas.height);

      // Draw ruler backgrounds
      hCtx.fillStyle = options.background;
      hCtx.fillRect(0, 0, hCanvas.width, RULER_SIZE);
      vCtx.fillStyle = options.background;
      vCtx.fillRect(0, 0, RULER_SIZE, vCanvas.height);

      hCtx.fillStyle = options.text;
      vCtx.fillStyle = options.text;
      hCtx.strokeStyle = options.text;
      vCtx.strokeStyle = options.text;
      hCtx.font = '10px Archivo';
      vCtx.font = '10px Archivo';

      const minTickSpacing = 50; // min pixels between major ticks
      const majorTickInterval = Math.pow(10, Math.ceil(Math.log10(minTickSpacing / Math.min(scaleX, scaleY))));
      
      // Horizontal Ruler
      for (let i = Math.floor(viewBox.x / majorTickInterval) * majorTickInterval; i < viewBox.x + viewBox.width; i += majorTickInterval / 10) {
        const xPos = svgLeft + (i - viewBox.x) * scaleX;
        const isMajor = Math.round(i * 100) % Math.round(majorTickInterval * 100) === 0;
        const tickHeight = isMajor ? 8 : 4;
        hCtx.beginPath();
        hCtx.moveTo(xPos, RULER_SIZE);
        hCtx.lineTo(xPos, RULER_SIZE - tickHeight);
        hCtx.stroke();
        if (isMajor) {
          hCtx.fillText(String(Math.round(i)), xPos + 2, 12);
        }
      }

      // Vertical Ruler
      for (let i = Math.floor(viewBox.y / majorTickInterval) * majorTickInterval; i < viewBox.y + viewBox.height; i += majorTickInterval / 10) {
        const yPos = svgTop + (i - viewBox.y) * scaleY;
        const isMajor = Math.round(i * 100) % Math.round(majorTickInterval * 100) === 0;
        const tickWidth = isMajor ? 8 : 4;
        vCtx.beginPath();
        vCtx.moveTo(RULER_SIZE, yPos);
        vCtx.lineTo(RULER_SIZE - tickWidth, yPos);
        vCtx.stroke();
        if (isMajor) {
          vCtx.save();
          vCtx.translate(12, yPos - 2);
          vCtx.rotate(-Math.PI / 2);
          vCtx.fillText(String(Math.round(i)), 0, 0);
          vCtx.restore();
        }
      }
    };
    
    drawRulers();
    const resizeObserver = new ResizeObserver(drawRulers);
    if(svgRef.current?.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }
    return () => resizeObserver.disconnect();
  }, [svgRef, viewBox, options]);

  return <>
    {/* FIX: Pass the React.MouseEvent directly instead of e.nativeEvent to match the expected event type. */}
    <canvas ref={hRulerRef} style={{ position: 'absolute', top: 0, left: RULER_SIZE, width: `calc(100% - ${RULER_SIZE}px)`, height: RULER_SIZE, cursor: 'ns-resize' }} onMouseDown={(e) => onRulerMouseDown(e, 'horizontal')} />
    {/* FIX: Pass the React.MouseEvent directly instead of e.nativeEvent to match the expected event type. */}
    <canvas ref={vRulerRef} style={{ position: 'absolute', top: RULER_SIZE, left: 0, width: RULER_SIZE, height: `calc(100% - ${RULER_SIZE}px)`, cursor: 'ew-resize' }} onMouseDown={(e) => onRulerMouseDown(e, 'vertical')} />
    <div style={{ position: 'absolute', top: 0, left: 0, width: RULER_SIZE, height: RULER_SIZE, background: options.background, borderRight: `1px solid ${options.text}40`, borderBottom: `1px solid ${options.text}40` }} />
  </>;
};

const Guides: React.FC<{
  svgRef: React.RefObject<SVGSVGElement>;
  viewBox: { x: number; y: number; width: number; height: number };
  guides: Guide[];
  options: CustomizationOptions['guides'];
  onGuideMouseDown: (e: MouseEvent, id: string, orientation: 'horizontal' | 'vertical') => void;
}> = ({ svgRef, viewBox, guides, options, onGuideMouseDown }) => {
    const [transform, setTransform] = useState({ scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 });

    useLayoutEffect(() => {
        const updateTransform = () => {
            if (!svgRef.current || !svgRef.current.parentElement) return;
            const svg = svgRef.current;
            const parent = svg.parentElement;
            const svgRect = svg.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            setTransform({
                scaleX: svgRect.width / viewBox.width,
                scaleY: svgRect.height / viewBox.height,
                offsetX: svgRect.left - parentRect.left,
                offsetY: svgRect.top - parentRect.top,
            });
        };
        updateTransform();
        const resizeObserver = new ResizeObserver(updateTransform);
        if(svgRef.current?.parentElement) {
          resizeObserver.observe(svgRef.current.parentElement);
        }
        return () => resizeObserver.disconnect();
    }, [svgRef, viewBox]);

    return <>
        {guides.map(guide => {
            const style: React.CSSProperties = {
                position: 'absolute',
                backgroundColor: options.color,
                zIndex: 10,
            };
            if (guide.orientation === 'horizontal') {
                style.top = (guide.position - viewBox.y) * transform.scaleY + transform.offsetY;
                style.left = RULER_SIZE;
                style.width = `calc(100% - ${RULER_SIZE}px)`;
                style.height = 1;
                style.cursor = 'ns-resize';
            } else {
                style.left = (guide.position - viewBox.x) * transform.scaleX + transform.offsetX;
                style.top = RULER_SIZE;
                style.height = `calc(100% - ${RULER_SIZE}px)`;
                style.width = 1;
                style.cursor = 'ew-resize';
            }
            // FIX: Pass the React.MouseEvent directly instead of e.nativeEvent to match the expected event type.
            return <div key={guide.id} style={style} onMouseDown={(e) => onGuideMouseDown(e, guide.id, guide.orientation)} />;
        })}
    </>;
};
