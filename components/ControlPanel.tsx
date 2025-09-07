import React, { ChangeEvent } from 'react';
import { AnchorIcon, HandlesIcon, OutlinesIcon, GridlinesIcon, CustomizeIcon, PreferencesIcon, LogoIcon } from './icons';
import type { Theme, CustomizationOptions } from '../types';

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
  theme: Theme;
  setTheme: (theme: Theme) => void;
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
      isActive ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800'
    }`}
  >
    <Icon className={`w-6 h-6 ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} />
    <span className={`text-xs ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
  </button>
);

const CollapsiblePanel: React.FC<{
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ Icon, label, isOpen, onClick, children }) => (
    <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
        <button 
            onClick={onClick}
            className="flex items-center w-full p-2 text-sm rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200"
            aria-expanded={isOpen}
        >
            <Icon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
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
        <label className="text-gray-600 dark:text-gray-400">{label}</label>
        {children}
    </div>
);

export const ControlPanel: React.FC<ControlPanelProps> = ({
  showAnchors, setShowAnchors, showHandles, setShowHandles,
  showOutlines, setShowOutlines, showGridlines, setShowGridlines,
  onGenerateAll, onUploadClick, hasSVG, theme, setTheme,
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
  
  const handleToggle = (e: ChangeEvent<HTMLInputElement>, section: keyof CustomizationOptions) => {
      setCustomization({...customization, [section]: e.target.checked});
  }

  return (
    <aside className="w-80 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-4 shadow-2xl">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
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
        <SettingRow label="Show Fill">
            <input type="checkbox" checked={customization.showFill} onChange={e => handleToggle(e, 'showFill')} className="toggle-checkbox" />
        </SettingRow>
        <h3 className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400 pt-2">Path</h3>
        <SettingRow label="Color">
            <input type="color" value={customization.path.stroke} onChange={e => handleCustomizationChange('path', 'stroke', e.target.value)} className="w-8 h-8"/>
        </SettingRow>
         <SettingRow label="Width">
            <input type="range" min="0.1" max="10" step="0.1" value={customization.path.strokeWidth} onChange={e => handleCustomizationChange('path', 'strokeWidth', parseFloat(e.target.value))} />
        </SettingRow>
        <h3 className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400 pt-2">Anchors</h3>
        <SettingRow label="Color">
            <input type="color" value={customization.anchors.color} onChange={e => handleCustomizationChange('anchors', 'color', e.target.value)} className="w-8 h-8"/>
        </SettingRow>
         <SettingRow label="Size">
            <input type="range" min="2" max="20" step="1" value={customization.anchors.size} onChange={e => handleCustomizationChange('anchors', 'size', parseInt(e.target.value))} />
        </SettingRow>
        <h3 className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400 pt-2">Handles</h3>
        <SettingRow label="Color">
            <input type="color" value={customization.handles.color} onChange={e => handleCustomizationChange('handles', 'color', e.target.value)} className="w-8 h-8"/>
        </SettingRow>
         <SettingRow label="Width">
            <input type="range" min="0.1" max="5" step="0.1" value={customization.handles.width} onChange={e => handleCustomizationChange('handles', 'width', parseFloat(e.target.value))} />
        </SettingRow>
        <h3 className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400 pt-2">Outlines</h3>
        <SettingRow label="Color">
            <input type="color" value={customization.outlines.color} onChange={e => handleCustomizationChange('outlines', 'color', e.target.value)} className="w-8 h-8"/>
        </SettingRow>
         <SettingRow label="Width">
            <input type="range" min="0.1" max="5" step="0.1" value={customization.outlines.width} onChange={e => handleCustomizationChange('outlines', 'width', parseFloat(e.target.value))} />
        </SettingRow>
        <SettingRow label="Style">
            <select value={customization.outlines.style} onChange={e => handleCustomizationChange('outlines', 'style', e.target.value)} className="bg-gray-200 dark:bg-gray-800 rounded p-1">
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
            </select>
        </SettingRow>
        <h3 className="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400 pt-2">Gridlines</h3>
        <SettingRow label="Color">
            <input type="color" value={customization.gridlines.color} onChange={e => handleCustomizationChange('gridlines', 'color', e.target.value)} className="w-8 h-8"/>
        </SettingRow>
         <SettingRow label="Width">
            <input type="range" min="0.1" max="3" step="0.1" value={customization.gridlines.width} onChange={e => handleCustomizationChange('gridlines', 'width', parseFloat(e.target.value))} />
        </SettingRow>
      </CollapsiblePanel>

      <CollapsiblePanel
        Icon={PreferencesIcon}
        label="Preferences"
        isOpen={openPanel === 'preferences'}
        onClick={() => setOpenPanel(openPanel === 'preferences' ? null : 'preferences')}
      >
        <SettingRow label="Theme">
            <div className="flex items-center gap-2">
                <span>Light</span>
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
                </button>
                <span>Dark</span>
            </div>
        </SettingRow>
      </CollapsiblePanel>
      
      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        {hasSVG && (
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onDownload('svg')} className="w-full text-center bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
                    Download SVG
                </button>
                <button onClick={() => onDownload('png')} className="w-full text-center bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
                    Download PNG
                </button>
            </div>
        )}
        <button 
          onClick={onUploadClick}
          className="w-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <span>{hasSVG ? "Upload New SVG" : "Upload SVG"}</span>
        </button>
        <button
          onClick={onGenerateAll}
          disabled={!hasSVG}
          className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <span>Generate All</span>
        </button>
      </div>
    </aside>
  );
};
