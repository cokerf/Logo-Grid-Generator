import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Canvas } from './components/Canvas';
import type { ParsedSVG, Theme, CustomizationOptions } from './types';
import { parseSVG } from './services/svgParser';

const initialCustomization: CustomizationOptions = {
  showFill: true,
  path: { stroke: '#888888', strokeWidth: 1 },
  anchors: { color: '#000000', size: 8 },
  handles: { color: '#888888', width: 1 },
  outlines: { color: '#000000', width: 1, style: 'dashed' },
  gridlines: { color: '#cccccc', width: 0.5 },
};

const initialDarkCustomization: CustomizationOptions = {
  showFill: true,
  path: { stroke: '#888888', strokeWidth: 1 },
  anchors: { color: '#FFFFFF', size: 8 },
  handles: { color: '#888888', width: 1 },
  outlines: { color: '#FFFFFF', width: 1, style: 'dashed' },
  gridlines: { color: '#444444', width: 0.5 },
};


export default function App(): JSX.Element {
  const [svgData, setSvgData] = useState<ParsedSVG | null>(null);
  const [showAnchors, setShowAnchors] = useState<boolean>(false);
  const [showHandles, setShowHandles] = useState<boolean>(false);
  const [showOutlines, setShowOutlines] = useState<boolean>(false);
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [customization, setCustomization] = useState<CustomizationOptions>(initialDarkCustomization);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      setCustomization(initialDarkCustomization);
    } else {
      document.documentElement.classList.remove('dark');
      setCustomization(initialCustomization);
    }
  }, [theme]);
  
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

  const handleDownload = useCallback((format: 'svg' | 'png') => {
    if (!svgRef.current || !svgData) return;

    const svgElement = svgRef.current;
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Set explicit size for export
    svgClone.setAttribute('width', svgData.width.toString());
    svgClone.setAttribute('height', svgData.height.toString());
    
    // Apply background for PNG
    if(format === 'png') {
      const style = document.createElement('style');
      style.textContent = `svg { background-color: ${theme === 'dark' ? '#111827' : '#f9fafb'}; }`;
      svgClone.prepend(style);
    }

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const download = (href: string, extension: string) => {
        const link = document.createElement('a');
        link.href = href;
        link.download = `logo-grid.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    }

    if (format === 'svg') {
      download(url, 'svg');
    } else {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svgData.width;
        canvas.height = svgData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          download(pngUrl, 'png');
        }
        URL.revokeObjectURL(url); // Revoke blob URL after use
      };
      img.onerror = () => {
         URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, [svgData, theme]);

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
    <div className="flex h-screen w-screen font-sans text-black dark:text-white bg-white dark:bg-black transition-colors duration-300">
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
        theme={theme}
        setTheme={setTheme}
        customization={customization}
        setCustomization={setCustomization}
        openPanel={openPanel}
        setOpenPanel={setOpenPanel}
        onDownload={handleDownload}
      />
      <main className="flex-1 flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <Canvas 
          svgData={svgData} 
          svgRef={svgRef}
          showAnchors={showAnchors}
          showHandles={showHandles}
          showOutlines={showOutlines}
          showGridlines={showGridlines}
          onUploadClick={handleUploadClick}
          error={error}
          customization={customization}
          theme={theme}
        />
      </main>
    </div>
  );
}
