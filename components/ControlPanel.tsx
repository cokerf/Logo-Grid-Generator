
import React, { useRef, useState, useEffect } from 'react';
import { AnchorIcon, HandlesIcon, OutlinesIcon, CanvasGridIcon, ElementGuidesIcon, AlignmentIcon, RulerIcon, CustomizeIcon, PreferencesIcon, UploadIcon, ExportIcon, LockIcon, UnlockIcon, UndoIcon, RedoIcon } from './icons';
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
  showAlignmentGuides: boolean;
  setShowAlignmentGuides: (value: boolean) => void;
  showRulers: boolean;
  setShowRulers: (value: boolean) => void;
  hasSVG: boolean;
  svgData: ParsedSVG | null;
  customization: CustomizationOptions;
  setCustomization: (options: CustomizationOptions) => void;
  openPanel: string | null;
  setOpenPanel: (panel: string | null) => void;
  onUploadClick: () => void;
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

const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg className="max-w-full max-h-full" viewBox="-11.71104965209961 -11.009389674663545 257.6430923461914 145.2664367675781" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g>
        <path d="M177.049 103.559H177.287C181.964 103.559 185.624 102.37 188.267 99.9915C190.909 97.6132 192.231 94.3628 192.231 90.2404C192.231 87.2014 191.279 84.8099 189.377 83.0658C187.5 81.2953 184.937 80.41 181.687 80.41H181.29L177.049 103.559ZM152.79 121L163.492 62.969H179.189C184.052 62.969 188.108 63.2068 191.358 63.6825C194.635 64.1582 197.317 64.8849 199.405 65.8626C203.977 68.1352 207.465 71.2535 209.87 75.2173C212.301 79.1548 213.516 83.7264 213.516 88.9323C213.516 93.8211 212.459 98.406 210.345 102.687C208.231 106.941 205.258 110.496 201.427 113.35C197.833 116.045 193.671 118.001 188.941 119.216C184.21 120.405 178.251 121 171.063 121H152.79Z" fill="#111827" stroke="none" />
      </g>
      <g>
        <path d="M121.099 121L131.841 62.969H153.166L142.464 121H121.099Z" fill="#111827" stroke="none" />
      </g>
      <g>
        <path d="M61.1045 121L71.8069 62.969H94.1631C102.54 62.969 108.896 64.4488 113.229 67.4085C117.563 70.3682 119.73 74.702 119.73 80.41C119.73 85.2459 118.475 89.2627 115.964 92.4602C113.48 95.6313 109.966 97.7057 105.421 98.6834L113.784 121H92.2605L85.9579 99.9122L82.0337 121H61.1045ZM87.9795 88.6945H89.5254C92.7229 88.6945 95.0748 88.1792 96.5811 87.1486C98.0874 86.0916 98.8405 84.4664 98.8405 82.273C98.8405 80.5818 98.2327 79.353 97.0171 78.5866C95.828 77.7939 93.9253 77.3975 91.3092 77.3975H90.0804L87.9795 88.6945Z" fill="#111827" stroke="none" />
      </g>
      <g>
        <path d="M56.2691193359375 113.77303918457031C52.2524193359375 116.54803918457031 48.1960193359375 118.62303918457032 44.1000193359375 119.99703918457031C40.0305193359375 121.37103918457031 35.8552193359375 122.05803918457032 31.5742193359375 122.05803918457032C22.8801193359375 122.05803918457032 15.8509193359375 119.54703918457031 10.4864693359375 114.52703918457031C5.1220393359375 109.50603918457031 2.4398193359375 102.95203918457031 2.4398193359375 94.86583918457032C2.4398193359375 90.53193918457032 3.1004643359375 86.48883918457031 4.4217493359375 82.73633918457031C5.7694693359375 78.95743918457032 7.7646193359375 75.53533918457032 10.407189335937499 72.46993918457031C13.4726193359375 68.79673918457031 17.2250193359375 65.99563918457031 21.6646193359375 64.06653918457032C26.1305193359375 62.13743918457031 31.0061193359375 61.17293918457031 36.2912193359375 61.17293918457031C42.4484193359375 61.17293918457031 47.7204193359375 62.414939184570315 52.1071193359375 64.89893918457031C56.5202193359375 67.38293918457032 60.0084193359375 71.09583918457031 62.5717193359375 76.03743918457032L43.7433193359375 83.01383918457032C42.7391193359375 81.61323918457032 41.5764193359375 80.58263918457031 40.2551193359375 79.92203918457031C38.9602193359375 79.26133918457032 37.4540193359375 78.93103918457031 35.7363193359375 78.93103918457031C32.036719335937505 78.93103918457031 29.0241193359375 80.29193918457031 26.6987193359375 83.01383918457032C24.3732193359375 85.70923918457031 23.2105193359375 89.19743918457031 23.2105193359375 93.4784391845703C23.2105193359375 97.04593918457032 24.2543193359375 99.91303918457031 26.3419193359375 102.08003918457031C28.4560193359375 104.24703918457031 31.2571193359375 105.33003918457031 34.7453193359375 105.33003918457031C35.2210193359375 105.33003918457031 35.7099193359375 105.31703918457032 36.2119193359375 105.29103918457031C36.7140193359375 105.23803918457031 37.2161193359375 105.17203918457031 37.7182193359375 105.09303918457032L38.7885193359375 99.42423918457031L31.2571193359375 99.42423918457031L33.675119335937495 86.26423918457031L61.3032193359375 86.26423918457031L56.2691193359375 113.77303918457031Z" fill="#111827" stroke="none" />
      </g>
      <g>
        <path d="M206.256 18.3423C203.238 18.3423 200.726 19.4169 198.722 21.5661C196.718 23.7154 195.715 26.3838 195.715 29.5714C195.715 32.3727 196.512 34.6064 198.106 36.2727C199.724 37.9148 201.873 38.7359 204.554 38.7359C207.524 38.7359 210.024 37.6371 212.052 35.4396C214.081 33.242 215.095 30.5374 215.095 27.3256C215.095 24.6934 214.262 22.5442 212.595 20.8779C210.929 19.1875 208.816 18.3423 206.256 18.3423ZM203.358 56.4127C199.543 56.4127 196.09 55.8935 192.999 54.8551C189.908 53.8167 187.155 52.2591 184.74 50.1823C182.18 47.9607 180.188 45.2198 178.763 41.9597C177.362 38.6996 176.662 35.2343 176.662 31.5637C176.662 27.5792 177.266 23.8723 178.473 20.4432C179.705 17.0141 181.528 13.8989 183.943 11.0977C186.768 7.76515 190.21 5.20539 194.267 3.41839C198.348 1.60724 202.743 0.70166 207.452 0.70166C215.421 0.70166 221.868 3.00786 226.795 7.62026C231.745 12.2085 234.221 18.1853 234.221 25.5507C234.221 29.5111 233.605 33.23 232.373 36.7074C231.142 40.1606 229.33 43.2637 226.94 46.0167C224.042 49.4216 220.589 52.0056 216.58 53.7684C212.571 55.5313 208.164 56.4127 203.358 56.4127Z" fill="#111827" stroke="none" />
      </g>
      <g>
        <path d="M167.189 48.8421C163.518 51.3778 159.812 53.2734 156.068 54.5292C152.35 55.7849 148.534 56.4128 144.622 56.4128C136.677 56.4128 130.254 54.1186 125.351 49.5304C120.449 44.9421 117.998 38.9533 117.998 31.5638C117.998 27.6034 118.602 23.9086 119.809 20.4795C121.041 17.0262 122.864 13.899 125.279 11.0977C128.08 7.74107 131.509 5.18131 135.566 3.41845C139.647 1.6556 144.103 0.77417 148.933 0.77417C154.559 0.77417 159.377 1.90916 163.386 4.17914C167.418 6.44911 170.606 9.842 172.948 14.3578L155.742 20.7331C154.825 19.4532 153.762 18.5114 152.555 17.9077C151.372 17.3039 149.995 17.0021 148.425 17.0021C145.045 17.0021 142.292 18.2457 140.167 20.7331C138.041 23.1962 136.979 26.3839 136.979 30.2959C136.979 33.556 137.933 36.1762 139.841 38.1563C141.772 40.1365 144.332 41.1266 147.52 41.1266C147.954 41.1266 148.401 41.1146 148.86 41.0904C149.319 41.0421 149.778 40.9817 150.237 40.9093L151.215 35.7294H144.332L146.542 23.7034H171.789L167.189 48.8421Z" fill="#111827" stroke="none" />
      </g>
      <g>
        <path d="M85.0884 18.3423C82.0698 18.3423 79.5583 19.4169 77.554 21.5661C75.5496 23.7154 74.5475 26.3838 74.5475 29.5714C74.5475 32.3727 75.3444 34.6064 76.9382 36.2727C78.5561 37.9148 80.7054 38.7359 83.3859 38.7359C86.3562 38.7359 88.8556 37.6371 90.8841 35.4396C92.9125 33.242 93.9268 30.5374 93.9268 27.3256C93.9268 24.6934 93.0937 22.5442 91.4274 20.8779C89.7611 19.1875 87.6481 18.3423 85.0884 18.3423ZM82.1905 56.4127C78.375 56.4127 74.9218 55.8935 71.8307 54.8551C68.7397 53.8167 65.9867 52.2591 63.5719 50.1823C61.0121 47.9607 59.0199 45.2198 57.5951 41.9597C56.1945 38.6996 55.4941 35.2343 55.4941 31.5637C55.4941 27.5792 56.0979 23.8723 57.3053 20.4432C58.5369 17.0141 60.3601 13.8989 62.775 11.0977C65.6004 7.76515 69.0416 5.20539 73.0985 3.41839C77.1797 1.60724 81.5747 0.70166 86.2837 0.70166C94.2528 0.70166 100.7 3.00786 105.627 7.62026C110.577 12.2085 113.053 18.1853 113.053 25.5507C113.053 29.5111 112.437 33.23 111.205 36.7074C109.974 40.1606 108.162 43.2637 105.772 46.0167C102.874 49.4216 99.4206 52.0056 95.4119 53.7684C91.4032 55.5313 86.9961 56.4127 82.1905 56.4127Z" fill="#111827" stroke="none" />
      </g>
      <g>
        <path d="M14 55L23.7802 1.96948H43.3769L36.567 38.6634H52.8673L49.8246 55H14Z" fill="#111827" stroke="none" />
      </g>
    </svg>
  );

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
  showElementGuides, setShowElementGuides, showAlignmentGuides, setShowAlignmentGuides,
  showRulers, setShowRulers,
  hasSVG, svgData, customization, setCustomization, 
  openPanel, setOpenPanel, onUploadClick, onExportSVG, onExportPNG,
  snapToGrid, setSnapToGrid, exportDimensions, setExportDimensions,
  onUndo, onRedo, canUndo, canRedo,
}) => {
  const [isAspectRatioLocked, setAspectRatioLocked] = useState(true);
  
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
        <div className="w-40 mr-auto">
            <Logo />
        </div>
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
        <button
            onClick={onUploadClick}
            className="w-full flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
            <UploadIcon className="w-5 h-5" />
            <span>Upload SVG</span>
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <ToggleButton Icon={AnchorIcon} label="Anchors" isActive={showAnchors} onClick={() => setShowAnchors(!showAnchors)} />
        <ToggleButton Icon={HandlesIcon} label="Handles" isActive={showHandles} onClick={() => setShowHandles(!showHandles)} />
        <ToggleButton Icon={OutlinesIcon} label="Outlines" isActive={showOutlines} onClick={() => setShowOutlines(!showOutlines)} />
        <ToggleButton Icon={CanvasGridIcon} label="Grid" isActive={showGridlines} onClick={() => setShowGridlines(!showGridlines)} />
        <ToggleButton Icon={ElementGuidesIcon} label="Guides" isActive={showElementGuides} onClick={() => setShowElementGuides(!showElementGuides)} />
        <ToggleButton Icon={AlignmentIcon} label="Alignment" isActive={showAlignmentGuides} onClick={() => setShowAlignmentGuides(!showAlignmentGuides)} />
        <ToggleButton Icon={RulerIcon} label="Rulers" isActive={showRulers} onClick={() => setShowRulers(!showRulers)} />
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
                <select value={customization.anchors.shape} onChange={e => handleCustomizationChange('anchors', 'shape', e.target.value)} className="bg-gray-200 rounded p-1 text-xs w-full">
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
                <select value={customization.outlines.style} onChange={e => handleCustomizationChange('outlines', 'style', e.target.value)} className="bg-gray-200 rounded p-1 text-xs w-full">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                </select>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Grid">
            <SettingRow label="Style">
                <select value={customization.gridlines.style} onChange={e => handleCustomizationChange('gridlines', 'style', e.target.value)} className="bg-gray-200 rounded p-1 text-xs w-full">
                    <option value="lines">Lines</option>
                    <option value="dots">Dots</option>
                </select>
            </SettingRow>
            <SettingRow label="Type">
                <select value={customization.gridlines.type} onChange={e => handleCustomizationChange('gridlines', 'type', e.target.value)} className="bg-gray-200 rounded p-1 text-xs w-full">
                    <option value="square">Square</option>
                    <option value="columns">Columns & Rows</option>
                </select>
            </SettingRow>
            {customization.gridlines.type === 'square' ? (
                <SettingRow label="Density">
                    <input type="range" min="2" max="100" step="1" value={customization.gridlines.density} onChange={e => handleCustomizationChange('gridlines', 'density', parseInt(e.target.value))} />
                </SettingRow>
            ) : (
                <>
                    <SettingRow label="Columns">
                        <input type="range" min="1" max="100" step="1" value={customization.gridlines.columns} onChange={e => handleCustomizationChange('gridlines', 'columns', parseInt(e.target.value))} />
                    </SettingRow>
                    <SettingRow label="Rows">
                        <input type="range" min="1" max="100" step="1" value={customization.gridlines.rows} onChange={e => handleCustomizationChange('gridlines', 'rows', parseInt(e.target.value))} />
                    </SettingRow>
                </>
            )}
             <SettingRow label="Color">
                 <ColorInput value={customization.gridlines.color} onChange={value => handleCustomizationChange('gridlines', 'color', value)} />
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="3" step="0.1" value={customization.gridlines.width} onChange={e => handleCustomizationChange('gridlines', 'width', parseFloat(e.target.value))} />
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Rulers & Guides">
            <SettingRow label="Ruler BG">
                <ColorInput value={customization.rulers.background} onChange={value => handleCustomizationChange('rulers', 'background', value)} />
            </SettingRow>
            <SettingRow label="Ruler Text">
                <ColorInput value={customization.rulers.text} onChange={value => handleCustomizationChange('rulers', 'text', value)} />
            </SettingRow>
            <SettingRow label="Guide Color">
                <ColorInput value={customization.guides.color} onChange={value => handleCustomizationChange('guides', 'color', value)} />
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
                <select value={customization.elementGuides.style} onChange={e => handleCustomizationChange('elementGuides', 'style', e.target.value)} className="bg-gray-200 rounded p-1 text-xs w-full">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                </select>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Alignment Guides">
            <SettingRow label="Color">
                 <ColorInput value={customization.alignmentGuides.color} onChange={value => handleCustomizationChange('alignmentGuides', 'color', value)} />
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="3" step="0.1" value={customization.alignmentGuides.width} onChange={e => handleCustomizationChange('alignmentGuides', 'width', parseFloat(e.target.value))} />
            </SettingRow>
            <SettingRow label="Style">
                <select value={customization.alignmentGuides.style} onChange={e => handleCustomizationChange('alignmentGuides', 'style', e.target.value)} className="bg-gray-200 rounded p-1 text-xs w-full">
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

      <div className="mt-auto pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        made with love in Lagos by{' '}
        <a 
            href="https://www.cokeroluwafemi.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="underline hover:text-black"
        >
            Coker Oluwafemi
        </a>
    </div>
    </aside>
  );
};
