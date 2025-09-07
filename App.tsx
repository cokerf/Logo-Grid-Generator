
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Canvas } from './components/Canvas';
import type { ParsedSVG } from './types';
import { parseSVG } from './services/svgParser';

export default function App(): JSX.Element {
  const [svgData, setSvgData] = useState<ParsedSVG | null>(null);
  const [showAnchors, setShowAnchors] = useState<boolean>(false);
  const [showHandles, setShowHandles] = useState<boolean>(false);
  const [showOutlines, setShowOutlines] = useState<boolean>(false);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const parsedData = parseSVG(content);
          if (parsedData.paths.length === 0) {
            setError("No paths found in the SVG. Please use an SVG with <path> elements.");
            setSvgData(null);
          } else {
            setSvgData(parsedData);
            setError(null);
          }
        } catch (err) {
          setError("Failed to parse SVG. Please check the file format.");
          setSvgData(null);
          console.error(err);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setSvgData(null);
      };
      reader.readAsText(file);
    } else {
        setError("Please select a valid SVG file.");
        setSvgData(null);
    }
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
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


  return (
    <div className="flex h-screen w-screen font-sans text-white bg-slate-900">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/svg+xml"
      />
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
        onUploadClick={handleUploadClick}
        hasSVG={!!svgData}
      />
      <main className="flex-1 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900">
        <Canvas 
          svgData={svgData} 
          showAnchors={showAnchors}
          showHandles={showHandles}
          showOutlines={showOutlines}
          showGridlines={showGridlines}
          onUploadClick={handleUploadClick}
          error={error}
        />
      </main>
    </div>
  );
}
