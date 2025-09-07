
import React from 'react';
import { AnchorIcon, HandlesIcon, OutlinesIcon, GridlinesIcon, CustomizeIcon, PreferencesIcon, GenerateIcon, LogoIcon } from './icons';

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
      isActive ? 'bg-slate-700' : 'bg-slate-900/50 hover:bg-slate-700/70'
    }`}
  >
    <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-400'}`} />
    <span className={`text-xs ${isActive ? 'text-white' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const NavButton: React.FC<{
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
}> = ({ Icon, label }) => (
  <button className="flex items-center w-full p-2 text-sm text-slate-300 rounded-md hover:bg-slate-700 transition-colors duration-200">
    <Icon className="w-5 h-5 mr-3 text-slate-400" />
    <span>{label}</span>
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-auto text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({
  showAnchors, setShowAnchors, showHandles, setShowHandles,
  showOutlines, setShowOutlines, showGridlines, setShowGridlines,
  onGenerateAll, onUploadClick, hasSVG
}) => {
  return (
    <aside className="w-72 bg-slate-800/80 border-r border-slate-700/50 p-4 flex flex-col gap-4 shadow-2xl">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
        <LogoIcon className="w-6 h-6 text-slate-300"/>
        <h1 className="text-lg font-semibold text-slate-200">Logo Grid Generator</h1>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <ToggleButton Icon={AnchorIcon} label="Anchors" isActive={showAnchors} onClick={() => setShowAnchors(!showAnchors)} />
        <ToggleButton Icon={HandlesIcon} label="Handles" isActive={showHandles} onClick={() => setShowHandles(!showHandles)} />
        <ToggleButton Icon={OutlinesIcon} label="Outlines" isActive={showOutlines} onClick={() => setShowOutlines(!showOutlines)} />
        <ToggleButton Icon={GridlinesIcon} label="Gridlines" isActive={showGridlines} onClick={() => setShowGridlines(!showGridlines)} />
      </div>

      <div className="border-t border-slate-700 pt-4 flex flex-col gap-2">
          <NavButton Icon={CustomizeIcon} label="Customize" />
          <NavButton Icon={PreferencesIcon} label="Preferences" />
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-slate-700">
        <button 
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-200 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          <GenerateIcon className="w-5 h-5" />
          <span>{hasSVG ? "Upload New SVG" : "Upload SVG"}</span>
        </button>
        <button
          onClick={onGenerateAll}
          disabled={!hasSVG}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
           <GenerateIcon className="w-5 h-5" />
          <span>Generate All</span>
        </button>
      </div>
    </aside>
  );
};
