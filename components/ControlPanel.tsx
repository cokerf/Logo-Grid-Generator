import React, { useRef, useState, useEffect } from 'react';
import { AnchorIcon, HandlesIcon, OutlinesIcon, CanvasGridIcon, ElementGuidesIcon, CustomizeIcon, PreferencesIcon, UploadIcon, ExportIcon, LockIcon, UnlockIcon, UndoIcon, RedoIcon } from './icons';
import type { CustomizationOptions, ParsedSVG } from '../types';
import { ColorInput } from './ColorInput';

interface ControlPanelProps {
  showAnchors: boolean;
  setShowAnchors: (value: boolean) => void;
  showHandles: boolean;
  setShowHandles: (value: boolean) => void;
  showOutlines: boolean;
  setShowOutlines: (value: boolean) => void;
  showGridlines: boolean;
  setShowGridlines: (value: boolean) => void;
  showElementGuides: boolean;
  setShowElementGuides: (value: boolean) => void;
  onGenerateAll: () => void;
  hasSVG: boolean;
  svgData: ParsedSVG | null;
  customization: CustomizationOptions;
  setCustomization: (options: CustomizationOptions) => void;
  openPanel: string | null;
  setOpenPanel: (panel: string | null) => void;
  onFileUpload: (file: File) => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  snapToGrid: boolean;
  setSnapToGrid: (value: boolean) => void;
  exportDimensions: { width: number; height: number; };
  setExportDimensions: (dims: { width: number; height: number; }) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ToggleButton: React.FC<{
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}> = ({ Icon, label, isActive, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200'
    } ${className}`}
    aria-label={`Toggle ${label}`}
    aria-pressed={isActive}
  >
    <Icon className={`w-6 h-6 ${isActive ? 'text-black' : 'text-gray-500'}`} />
    <span className={`text-xs ${isActive ? 'text-black' : 'text-gray-500'}`}>{label}</span>
  </button>
);

const CollapsiblePanel: React.FC<{
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ Icon, label, isOpen, onClick, children }) => (
    <div className="border-t border-gray-200 pt-4">
        <button 
            onClick={onClick}
            className="flex items-center w-full p-2 text-sm rounded-md hover:bg-gray-200 transition-colors duration-200"
            aria-expanded={isOpen}
        >
            <Icon className="w-5 h-5 mr-3 text-gray-500" />
            <span>{label}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ml-auto text-gray-500 transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
        {isOpen && <div className="p-2 space-y-4">{children}</div>}
    </div>
);

const SettingRow: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="flex items-center justify-between text-sm gap-4">
        <label className="text-gray-600 shrink-0">{label}</label>
        <div className="flex-1">{children}</div>
    </div>
);

const CustomizeSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div className="pt-4 mt-4 border-t border-gray-200 first:mt-0 first:pt-0 first:border-0">
        <h3 className="font-semibold text-xs uppercase text-gray-500 mb-3">{title}</h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
)

export const ControlPanel: React.FC<ControlPanelProps> = ({
  showAnchors, setShowAnchors, showHandles, setShowHandles,
  showOutlines, setShowOutlines, showGridlines, setShowGridlines,
  showElementGuides, setShowElementGuides,
  onGenerateAll, hasSVG, svgData, customization, setCustomization, 
  openPanel, setOpenPanel, onFileUpload, onExportSVG, onExportPNG,
  snapToGrid, setSnapToGrid, exportDimensions, setExportDimensions,
  onUndo, onRedo, canUndo, canRedo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAspectRatioLocked, setAspectRatioLocked] = useState(true);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        onFileUpload(file);
    }
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleCustomizationChange = (section: keyof CustomizationOptions, key: string, value: any) => {
    setCustomization({
        ...customization,
        [section]: {
            // @ts-ignore
            ...customization[section],
            [key]: value
        }
    });
  };
  
  const handleSimpleCustomizationChange = (key: keyof CustomizationOptions, value: any) => {
    setCustomization({ ...customization, [key]: value });
  };

  const handleDimensionChange = (axis: 'width' | 'height', value: number) => {
    const numValue = Math.max(0, value);
    if (isAspectRatioLocked && svgData && svgData.width > 0 && svgData.height > 0) {
      const aspectRatio = svgData.width / svgData.height;
      if (axis === 'width') {
        setExportDimensions({ width: numValue, height: Math.round(numValue / aspectRatio) });
      } else {
        setExportDimensions({ width: Math.round(numValue * aspectRatio), height: numValue });
      }
    } else {
      setExportDimensions({ ...exportDimensions, [axis]: numValue });
    }
  };

  return (
    <aside className="w-80 bg-white p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-center pb-2 border-b border-gray-200">
        <h1 className="text-lg font-semibold mr-auto">Logo Grid Generator</h1>
        <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded hover:bg-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              aria-label="Undo"
            >
              <UndoIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded hover:bg-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              aria-label="Redo"
            >
              <RedoIcon className="w-5 h-5" />
            </button>
          </div>
      </div>

      <div className="pb-4 border-b border-gray-200">
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/svg+xml"
            className="hidden"
            aria-label="Upload SVG file"
        />
        <button
            onClick={handleUploadClick}
            className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
            <UploadIcon className="w-5 h-5" />
            <span>Upload SVG</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <ToggleButton Icon={AnchorIcon} label="Anchors" isActive={showAnchors} onClick={() => setShowAnchors(!showAnchors)} />
        <ToggleButton Icon={HandlesIcon} label="Handles" isActive={showHandles} onClick={() => setShowHandles(!showHandles)} />
        <ToggleButton Icon={OutlinesIcon} label="Outlines" isActive={showOutlines} onClick={() => setShowOutlines(!showOutlines)} />
        <ToggleButton Icon={CanvasGridIcon} label="Grid" isActive={showGridlines} onClick={() => setShowGridlines(!showGridlines)} />
        <ToggleButton Icon={ElementGuidesIcon} label="Guides" isActive={showElementGuides} onClick={() => setShowElementGuides(!showElementGuides)} className="col-span-2" />
      </div>

      <CollapsiblePanel
        Icon={CustomizeIcon}
        label="Customize"
        isOpen={openPanel === 'customize'}
        onClick={() => setOpenPanel(openPanel === 'customize' ? null : 'customize')}
      >
        <CustomizeSection title="Fill">
            <SettingRow label="Show Fill">
                <input type="checkbox" checked={customization.showFill} onChange={e => handleSimpleCustomizationChange('showFill', e.target.checked)} className="toggle-checkbox" />
            </SettingRow>
             <SettingRow label="Color">
                <ColorInput value={customization.fillColor} onChange={value => handleSimpleCustomizationChange('fillColor', value)} />
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Path">
            <SettingRow label="Color">
                <ColorInput value={customization.path.stroke} onChange={value => handleCustomizationChange('path', 'stroke', value)} />
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="10" step="0.1" value={customization.path.strokeWidth} onChange={e => handleCustomizationChange('path', 'strokeWidth', parseFloat(e.target.value))} />
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Anchors">
            <SettingRow label="Color">
                <ColorInput value={customization.anchors.color} onChange={value => handleCustomizationChange('anchors', 'color', value)} />
            </SettingRow>
             <SettingRow label="Size">
                <input type="range" min="2" max="20" step="1" value={customization.anchors.size} onChange={e => handleCustomizationChange('anchors', 'size', parseInt(e.target.value))} />
            </SettingRow>
            <SettingRow label="Shape">
                <select value={customization.anchors.shape} onChange={e => handleCustomizationChange('anchors', 'shape', e.target.value)} className="bg-gray-200 rounded p-1 text-xs">
                    <option value="square">Square</option>
                    <option value="circle">Circle</option>
                </select>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Handles">
            <SettingRow label="Color">
                <ColorInput value={customization.handles.color} onChange={value => handleCustomizationChange('handles', 'color', value)} />
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="5" step="0.1" value={customization.handles.width} onChange={e => handleCustomizationChange('handles', 'width', parseFloat(e.target.value))} />
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Outlines">
            <SettingRow label="Color">
                <ColorInput value={customization.outlines.color} onChange={value => handleCustomizationChange('outlines', 'color', value)} />
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="5" step="0.1" value={customization.outlines.width} onChange={e => handleCustomizationChange('outlines', 'width', parseFloat(e.target.value))} />
            </SettingRow>
            <SettingRow label="Style">
                <select value={customization.outlines.style} onChange={e => handleCustomizationChange('outlines', 'style', e.target.value)} className="bg-gray-200 rounded p-1 text-xs">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                </select>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Grid">
            <SettingRow label="Color">
                 <ColorInput value={customization.gridlines.color} onChange={value => handleCustomizationChange('gridlines', 'color', value)} />
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="3" step="0.1" value={customization.gridlines.width} onChange={e => handleCustomizationChange('gridlines', 'width', parseFloat(e.target.value))} />
            </SettingRow>
            <SettingRow label="Style">
                <select value={customization.gridlines.style} onChange={e => handleCustomizationChange('gridlines', 'style', e.target.value)} className="bg-gray-200 rounded p-1 text-xs">
                    <option value="lines">Lines</option>
                    <option value="dots">Dots</option>
                </select>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Element Guides">
            <SettingRow label="Color">
                 <ColorInput value={customization.elementGuides.color} onChange={value => handleCustomizationChange('elementGuides', 'color', value)} />
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="3" step="0.1" value={customization.elementGuides.width} onChange={e => handleCustomizationChange('elementGuides', 'width', parseFloat(e.target.value))} />
            </SettingRow>
            <SettingRow label="Style">
                <select value={customization.elementGuides.style} onChange={e => handleCustomizationChange('elementGuides', 'style', e.target.value)} className="bg-gray-200 rounded p-1 text-xs">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                </select>
            </SettingRow>
        </CustomizeSection>
      </CollapsiblePanel>

      <CollapsiblePanel
        Icon={PreferencesIcon}
        label="Preferences"
        isOpen={openPanel === 'preferences'}
        onClick={() => setOpenPanel(openPanel === 'preferences' ? null : 'preferences')}
      >
        <CustomizeSection title="Canvas">
            <SettingRow label="Background">
                 <ColorInput value={customization.canvasBackground} onChange={value => handleSimpleCustomizationChange('canvasBackground', value)} />
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Editing">
            <SettingRow label="Snap to Grid">
                 <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} className="toggle-checkbox" />
            </SettingRow>
        </CustomizeSection>
      </CollapsiblePanel>

      <CollapsiblePanel
        Icon={ExportIcon}
        label="Export"
        isOpen={openPanel === 'export'}
        onClick={() => setOpenPanel(openPanel === 'export' ? null : 'export')}
      >
        <div className="space-y-3">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Width</label>
                <input 
                  type="number"
                  value={Math.round(exportDimensions.width)}
                  onChange={e => handleDimensionChange('width', parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-gray-200 p-2 rounded text-sm"
                  disabled={!hasSVG}
                />
              </div>
              <button 
                onClick={() => setAspectRatioLocked(!isAspectRatioLocked)}
                className="mt-5 p-2 rounded hover:bg-gray-200"
                aria-label="Toggle aspect ratio lock"
                disabled={!hasSVG}
              >
                {isAspectRatioLocked ? <LockIcon className="w-5 h-5"/> : <UnlockIcon className="w-5 h-5"/>}
              </button>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Height</label>
                <input 
                  type="number"
                  value={Math.round(exportDimensions.height)}
                  onChange={e => handleDimensionChange('height', parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-gray-200 p-2 rounded text-sm"
                  disabled={!hasSVG}
                />
              </div>
            </div>
            <button
              onClick={onExportSVG}
              disabled={!hasSVG}
              className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Export as SVG
            </button>
            <button
              onClick={onExportPNG}
              disabled={!hasSVG}
              className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Export as High-Res PNG
            </button>
        </div>
      </CollapsiblePanel>
      
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onGenerateAll}
          disabled={!hasSVG}
          className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <span>Toggle All Previews</span>
        </button>
      </div>
    </aside>
  );
};