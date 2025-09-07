import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Canvas } from './components/Canvas';
import type { ParsedSVG, CustomizationOptions, Point } from './types';
import { parseSVG, segmentsToD, parsePathD } from './services/svgParser';

const initialCustomization: CustomizationOptions = {
  showFill: true,
  fillColor: '#cccccc33',
  path: { stroke: '#888888', strokeWidth: 1 },
  anchors: { color: '#000000', size: 8, shape: 'square' },
  handles: { color: '#888888', width: 1 },
  outlines: { color: '#000000', width: 1, style: 'dashed' },
  gridlines: { color: '#cccccc', width: 0.5 },
  canvasBackground: '#f9fafb',
};

export default function App(): JSX.Element {
  const [svgData, setSvgData] = useState<ParsedSVG | null>(null);
  const [showAnchors, setShowAnchors] = useState<boolean>(false);
  const [showHandles, setShowHandles] = useState<boolean>(false);
  const [showOutlines, setShowOutlines] = useState<boolean>(false);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [customization, setCustomization] = useState<CustomizationOptions>(initialCustomization);

  const svgRef = useRef<SVGSVGElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const svgContent = e.target?.result as string;
        if (svgContent) {
            try {
                const parsedData = parseSVG(svgContent);
                if (parsedData.paths.length === 0) {
                    setError("No paths found in the uploaded SVG. Please use an SVG with <path> elements.");
                    setSvgData(null);
                } else {
                    setSvgData(parsedData);
                    setError(null);
                }
            } catch (err) {
                setError("Failed to parse the SVG file. Please check its format.");
                setSvgData(null);
                console.error(err);
            }
        }
    };
    reader.onerror = () => {
        setError("Failed to read the file.");
        setSvgData(null);
    };
    reader.readAsText(file);
  }, []);


  const generateAll = useCallback(() => {
    setShowAnchors(true);
    setShowHandles(true);
    setShowOutlines(true);
    setShowGridlines(true);
  }, []);

  // Effect to add bounding boxes after parsing
  useEffect(() => {
    if (!svgData || svgData.paths.some(p => p.boundingBox)) return;

    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.style.position = 'absolute';
    tempSvg.style.visibility = 'hidden';
    document.body.appendChild(tempSvg);

    const updatedPaths = svgData.paths.map(path => {
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', path.d);
      tempSvg.appendChild(pathEl);
      const bbox = pathEl.getBBox();
      tempSvg.removeChild(pathEl);
      return { ...path, boundingBox: bbox };
    });

    document.body.removeChild(tempSvg);
    
    setSvgData(prev => prev ? { ...prev, paths: updatedPaths } : null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgData?.rawSVG]);

  const handleHandleMove = useCallback((pathIndex: number, handleIndex: number, newPosition: Point) => {
    setSvgData(currentSvgData => {
      if (!currentSvgData) return null;

      const newPaths = [...currentSvgData.paths];
      const path = newPaths[pathIndex];

      if (!path || !path.handles[handleIndex]) return currentSvgData;

      const handle = path.handles[handleIndex];

      const newSegments = JSON.parse(JSON.stringify(path.segments));
      const segmentToUpdate = newSegments[handle.segmentIndex];
      if (!segmentToUpdate) return currentSvgData;

      segmentToUpdate.values[handle.valueIndex] = newPosition.x;
      segmentToUpdate.values[handle.valueIndex + 1] = newPosition.y;

      const newD = segmentsToD(newSegments);
      
      const { points: newPoints, handles: newHandles, segments: updatedSegments } = parsePathD(newD);
      
      newPaths[pathIndex] = {
        ...path,
        d: newD,
        segments: updatedSegments,
        points: newPoints,
        handles: newHandles,
      };

      return {
        ...currentSvgData,
        paths: newPaths,
      };
    });
  }, []);


  return (
    <div className="flex h-screen w-screen font-sans text-black bg-white transition-colors duration-300">
      <ControlPanel
        showAnchors={showAnchors}
        setShowAnchors={setShowAnchors}
        showHandles={showHandles}
        setShowHandles={setShowHandles}
        showOutlines={showOutlines}
        setShowOutlines={setShowOutlines}
        showGridlines={showGridlines}
        setShowGridlines={setShowGridlines}
        onGenerateAll={generateAll}
        hasSVG={!!svgData}
        customization={customization}
        setCustomization={setCustomization}
        openPanel={openPanel}
        setOpenPanel={setOpenPanel}
        onFileUpload={handleFileUpload}
      />
      <main className="flex-1 flex items-center justify-center p-4 bg-gray-100 transition-colors duration-300">
        <Canvas 
          svgData={svgData} 
          svgRef={svgRef}
          showAnchors={showAnchors}
          showHandles={showHandles}
          showOutlines={showOutlines}
          showGridlines={showGridlines}
          error={error}
          customization={customization}
          onHandleMove={handleHandleMove}
        />
      </main>
    </div>
  );
}