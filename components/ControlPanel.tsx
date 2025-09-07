import React, { ChangeEvent } from 'react';
import { AnchorIcon, HandlesIcon, OutlinesIcon, GridlinesIcon, CustomizeIcon, PreferencesIcon, LogoIcon } from './icons';
import type { CustomizationOptions } from '../types';

interface ControlPanelProps {
  showAnchors: boolean;
  setShowAnchors: (value: boolean) => void;
  showHandles: boolean;
  setShowHandles: (value: boolean) => void;
  showOutlines: boolean;
  setShowOutlines: (value: boolean) => void;
  showGridlines: boolean;
  setShowGridlines: (value: boolean) => void;
  onGenerateAll: () => void;
  onUploadClick: () => void;
  hasSVG: boolean;
  customization: CustomizationOptions;
  setCustomization: (options: CustomizationOptions) => void;
  openPanel: string | null;
  setOpenPanel: (panel: string | null) => void;
  onDownload: (format: 'svg' | 'png') => void;
}

const ToggleButton: React.FC<{
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-1 flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200 ${
      isActive ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200'
    }`}
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
    <div className="flex items-center justify-between text-sm">
        <label className="text-gray-600">{label}</label>
        {children}
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
  onGenerateAll, onUploadClick, hasSVG,
  customization, setCustomization, openPanel, setOpenPanel, onDownload
}) => {

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

  return (
    <aside className="w-80 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 shadow-2xl">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <LogoIcon className="w-6 h-6"/>
        <h1 className="text-lg font-semibold">Logo Grid Generator</h1>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <ToggleButton Icon={AnchorIcon} label="Anchors" isActive={showAnchors} onClick={() => setShowAnchors(!showAnchors)} />
        <ToggleButton Icon={HandlesIcon} label="Handles" isActive={showHandles} onClick={() => setShowHandles(!showHandles)} />
        <ToggleButton Icon={OutlinesIcon} label="Outlines" isActive={showOutlines} onClick={() => setShowOutlines(!showOutlines)} />
        <ToggleButton Icon={GridlinesIcon} label="Gridlines" isActive={showGridlines} onClick={() => setShowGridlines(!showGridlines)} />
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
                <input type="color" value={customization.fillColor} onChange={e => handleSimpleCustomizationChange('fillColor', e.target.value)} className="w-8 h-8"/>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Path">
            <SettingRow label="Color">
                <input type="color" value={customization.path.stroke} onChange={e => handleCustomizationChange('path', 'stroke', e.target.value)} className="w-8 h-8"/>
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="10" step="0.1" value={customization.path.strokeWidth} onChange={e => handleCustomizationChange('path', 'strokeWidth', parseFloat(e.target.value))} />
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Anchors">
            <SettingRow label="Color">
                <input type="color" value={customization.anchors.color} onChange={e => handleCustomizationChange('anchors', 'color', e.target.value)} className="w-8 h-8"/>
            </SettingRow>
             <SettingRow label="Size">
                <input type="range" min="2" max="20" step="1" value={customization.anchors.size} onChange={e => handleCustomizationChange('anchors', 'size', parseInt(e.target.value))} />
            </SettingRow>
            <SettingRow label="Shape">
                <select value={customization.anchors.shape} onChange={e => handleCustomizationChange('anchors', 'shape', e.target.value)} className="bg-gray-200 rounded p-1">
                    <option value="square">Square</option>
                    <option value="circle">Circle</option>
                </select>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Handles">
            <SettingRow label="Color">
                <input type="color" value={customization.handles.color} onChange={e => handleCustomizationChange('handles', 'color', e.target.value)} className="w-8 h-8"/>
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="5" step="0.1" value={customization.handles.width} onChange={e => handleCustomizationChange('handles', 'width', parseFloat(e.target.value))} />
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Outlines">
            <SettingRow label="Color">
                <input type="color" value={customization.outlines.color} onChange={e => handleCustomizationChange('outlines', 'color', e.target.value)} className="w-8 h-8"/>
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="5" step="0.1" value={customization.outlines.width} onChange={e => handleCustomizationChange('outlines', 'width', parseFloat(e.target.value))} />
            </SettingRow>
            <SettingRow label="Style">
                <select value={customization.outlines.style} onChange={e => handleCustomizationChange('outlines', 'style', e.target.value)} className="bg-gray-200 rounded p-1">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                </select>
            </SettingRow>
        </CustomizeSection>
        <CustomizeSection title="Gridlines">
            <SettingRow label="Color">
                <input type="color" value={customization.gridlines.color} onChange={e => handleCustomizationChange('gridlines', 'color', e.target.value)} className="w-8 h-8"/>
            </SettingRow>
             <SettingRow label="Width">
                <input type="range" min="0.1" max="3" step="0.1" value={customization.gridlines.width} onChange={e => handleCustomizationChange('gridlines', 'width', parseFloat(e.target.value))} />
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
                 <input type="color" value={customization.canvasBackground} onChange={e => handleSimpleCustomizationChange('canvasBackground', e.target.value)} className="w-8 h-8"/>
            </SettingRow>
        </CustomizeSection>
      </CollapsiblePanel>
      
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-200">
        {hasSVG && (
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onDownload('svg')} className="w-full text-center bg-gray-200 hover:bg-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
                    Download SVG
                </button>
                <button onClick={() => onDownload('png')} className="w-full text-center bg-gray-200 hover:bg-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
                    Download PNG
                </button>
            </div>
        )}
        <button 
          onClick={onUploadClick}
          className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <span>{hasSVG ? "Upload New SVG" : "Upload SVG"}</span>
        </button>
        <button
          onClick={onGenerateAll}
          disabled={!hasSVG}
          className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <span>Generate All</span>
        </button>
      </div>
    </aside>
  );
};